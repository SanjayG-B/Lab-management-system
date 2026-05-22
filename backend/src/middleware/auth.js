import jwt from 'jsonwebtoken';
import { dbService } from '../services/db.service.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_lab_key_12345');
    const user = await dbService.findById('User', decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user associated with this token.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token validation failed. Token may be expired or corrupt.'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role || 'unauthenticated'}' is not permitted.`
      });
    }
    next();
  };
};
