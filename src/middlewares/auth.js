import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    // --- DEMO MODE SUPPORT ---
    if (token.startsWith('demo_token_')) {
      let role = 'student';
      if (token.includes('super_admin')) role = 'super-admin';
      else if (token.includes('admin')) role = 'admin';
      else if (token.includes('instructor')) role = 'instructor';

      req.user = {
        _id: '000000000000000000000000', // Mock ObjectId
        email: `demo@${role}.com`,
        role: role,
        name: 'Demo User',
        division: role === 'admin' ? '111111111111111111111111' : undefined // Mock division for demo admin
      };
      return next();
    }
    // -------------------------

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return res.status(401).json({ message: 'User no longer exists' });

    if ((decoded.tokenVersion ?? 0) !== (currentUser.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    // --- VIEW PORTAL AS (ROLE SWITCH) SUPPORT ---
    const viewRole = req.headers['x-view-role'];
    if (viewRole && viewRole !== currentUser.role) {
      if (['super-admin', 'admin', 'instructor'].includes(currentUser.role)) {
        const roleHierarchy = { 'super-admin': 3, 'admin': 2, 'instructor': 1, 'student': 0 };
        const normalizedViewRole = viewRole === 'super_admin' ? 'super-admin' : viewRole;
        
        // Only allow downgrading or lateral movement, never upgrading
        if (roleHierarchy[normalizedViewRole] <= roleHierarchy[currentUser.role]) {
          // SAFEGUARD: Only override the role for GET requests to prevent accidental database saves 
          // (like req.user.save()) from permanently demoting the admin in the database.
          if (req.method === 'GET') {
            currentUser.role = normalizedViewRole;
          }
        }
      }
    }

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Alias for project compatibility
export const authMiddleware = protect;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not authorized to access this resource` 
      });
    }
    next();
  };
};
