import Enrollment from "../models/Enrollment.js";
import Bootcamp from "../models/Bootcamp.js";

export const activateEnrollment = async (studentId, otpCode) => {
  const enrollment = await Enrollment.findOne({ 
    student: studentId, 
    "enrollment_otp.code": otpCode 
  });

  if (!enrollment) {
    throw new Error("Invalid or expired enrollment code.");
  }

  if (enrollment.enrollment_otp.expiresAt < new Date()) {
    throw new Error("Enrollment code has expired. Please contact support.");
  }

  enrollment.is_active = true;
  enrollment.enrollment_otp = undefined; // Clear OTP after success
  enrollment.activated_at = new Date();
  
  await enrollment.save();

  return { success: true, message: "Bootcamp enrollment activated successfully!" };
};

export const getMyEnrollments = async (studentId) => {
  return await Enrollment.find({ student: studentId })
    .populate('bootcamp', 'name startDate endDate bannerImage description bootcampType division')
    .sort('-createdAt');
};

export const getBootcampEnrollments = async (bootcampId) => {
  return await Enrollment.find({ bootcamp: bootcampId, is_active: true })
    .populate('student', 'name email campusId');
};

export const enrollInternalBootcamp = async (studentId, bootcampId, user) => {
  const bootcamp = await Bootcamp.findById(bootcampId);
  if (!bootcamp) throw new Error("Bootcamp not found");

  if (bootcamp.bootcampType !== 'internal') {
    throw new Error("Direct member enrollment is only available for internal bootcamps.");
  }

  if (!bootcamp.isPublished) {
    throw new Error("This internal bootcamp is not available yet.");
  }

  const hasDivisionMembership = (user.memberships || []).some((membership) => {
    const membershipDivisionId = membership.division?._id || membership.division;
    return membership.isMember && membershipDivisionId?.toString() === bootcamp.division.toString();
  });

  if (!hasDivisionMembership) {
    throw new Error("This internal bootcamp is only available to verified members of its division.");
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, bootcamp: bootcampId },
    {
      student: studentId,
      bootcamp: bootcampId,
      is_active: true,
      enrollment_otp: undefined,
      activated_at: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('bootcamp', 'name division description startDate endDate bootcampType');

  return { success: true, message: "Internal bootcamp enrolled successfully.", data: enrollment };
};
