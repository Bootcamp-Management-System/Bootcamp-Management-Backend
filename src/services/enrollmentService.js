import Enrollment from "../models/Enrollment.js";

export const activateEnrollmentRepo = async (studentId, bootcampId, otp) => {
  const enrollment = await Enrollment.findOne({ student: studentId, bootcamp: bootcampId });
  if (!enrollment) throw new Error("Enrollment record not found for this bootcamp.");

  if (enrollment.is_active) {
    throw new Error("You are already enrolled and active in this bootcamp.");
  }

  if (!enrollment.enrollment_otp || enrollment.enrollment_otp.code !== otp || enrollment.enrollment_otp.expiresAt < Date.now()) {
    throw new Error("Invalid or expired activation OTP.");
  }

  enrollment.is_active = true;
  enrollment.activated_at = new Date();
  enrollment.enrollment_otp = undefined; // Clear the OTP after successful use
  await enrollment.save();

  return enrollment;
};

export const getStudentActiveEnrollmentsRepo = async (studentId) => {
  return await Enrollment.find({ student: studentId, is_active: true }).populate('bootcamp', 'name description');
};
