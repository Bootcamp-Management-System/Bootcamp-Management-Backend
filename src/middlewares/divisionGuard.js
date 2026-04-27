/**
 * Middleware to check if the user has access to a specific division.
 * Super Admin has access to all divisions.
 * Admins only have access to their own division.
 */
export const checkDivisionAccess = (req, res, next) => {
  const { user } = req;
  const targetDivisionId = req.params.divisionId || req.body?.division || req.query?.divisionId;

  if (user.role === 'super-admin' || user.role === 'super_admin') {
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
    if (req.query) req.query.division = user.division;
    if (req.body) req.body.division = user.division;
    
    return next();
  }

  // Instructors and Students might also be restricted by division depending on the resource
  if (user.role === 'instructor' || user.role === 'student') {
     // For now, allow but we might want more granular checks later
     return next();
  }

  res.status(403).json({ message: 'Unauthorized division access' });
};
