export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Make sure user object exists
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User role not found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }
    next();
  };
};
