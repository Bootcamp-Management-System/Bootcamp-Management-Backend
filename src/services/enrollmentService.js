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
    .populate('bootcamp', 'name startDate endDate bannerImage')
    .sort('-createdAt');
};
