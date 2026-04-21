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

    if ((decoded.tokenVersion ?? 0) !== (currentUser.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
