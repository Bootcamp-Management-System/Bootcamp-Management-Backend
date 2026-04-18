import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Fetch the whole user object from DB so req.user.role exists for restrictTo
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return res.status(401).json({ message: 'User no longer exists' });

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Middleware to check if the user has access to a specific division.
 * Super Admin has access to all divisions.
 * Admins only have access to their own division.
 */
export const checkDivisionAccess = (req, res, next) => {
  const { user } = req;
  const targetDivisionId = req.params.divisionId || req.body.division || req.query.divisionId;

  if (user.role === 'super-admin') {
    return next();
  }

  if (user.role === 'admin') {
    if (!user.division) {
      return res.status(403).json({ message: 'Admin is not assigned to any division' });
    }

    // If a target division is specified, check if it matches the admin's division
    if (targetDivisionId && user.division.toString() !== targetDivisionId.toString()) {
      return res.status(403).json({ message: 'You only have access to your own division' });
    }

    // Inject the user's division into the request body/query for automatic filtering in controllers
    req.query.division = user.division;
    req.body.division = user.division;
    
    return next();
  }

  // Instructors and Students might also be restricted by division depending on the resource
  if (user.role === 'instructor' || user.role === 'student') {
     // For now, allow but we might want more granular checks later
     return next();
  }

  res.status(403).json({ message: 'Unauthorized division access' });
};
