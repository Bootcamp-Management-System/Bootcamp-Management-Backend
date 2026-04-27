import Enrollment from "../models/Enrollment.js";

// @desc    Middleware to ensure only accepted students or authorized staff can access bootcamp-specific data
export const bootcampGuard = async (req, res, next) => {
  const { user } = req;
  const bootcampId = req.params.bootcampId || req.query.bootcamp || req.body?.bootcamp;

  // 1. Super Admins always have access
  if (user.role === 'super-admin') return next();

  // 2. If no bootcampId is provided (e.g. general GET /sessions), 
  // the controller itself will handle filtering. We just pass through.
  if (!bootcampId) return next();

  try {
    // 3. For Staff (Admin/Instructor)
    if (['admin', 'instructor'].includes(user.role)) {
      // Check if they belong to the division of this bootcamp or are explicitly assigned
      // (Simplified: Trust their role for now, or add division check if needed)
      return next();
    }

    // 4. For Students
    if (user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: user.id,
        bootcamp: bootcampId,
        is_active: true
      });

      if (!enrollment) {
        return res.status(403).json({ 
          error: "Access Denied. You must be an active student of this bootcamp to view these resources." 
        });
      }
      return next();
    }

    res.status(403).json({ error: "Access Denied. Unauthorized role." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
