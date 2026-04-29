import * as enrollmentService from "../services/enrollmentService.js";

// @desc    Activate enrollment using OTP
// @route   POST /api/v1/enrollments/activate
export const activateEnrollment = async (req, res) => {
  try {
    const { otp } = req.body;
    const result = await enrollmentService.activateEnrollment(req.user.id, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get user's enrollments
// @route   GET /api/v1/enrollments/me
export const getMyEnrollments = async (req, res) => {
  try {
    const data = await enrollmentService.getMyEnrollments(req.user.id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBootcampEnrollments = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const data = await enrollmentService.getBootcampEnrollments(bootcampId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
