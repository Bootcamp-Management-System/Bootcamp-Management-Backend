export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Make sure user object exists (should be set by authMiddleware)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User role not found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }
    next();
  };
};
