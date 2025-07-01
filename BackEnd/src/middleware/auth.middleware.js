import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Middleware to protect routes using JWT authentication
// To access protected routes, send the token in the Authorization header:
// Authorization: Bearer <your_token_here>
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookie (access_token)
    else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      console.warn('Auth Middleware: No token provided');
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.warn('Auth Middleware: User not found for token');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if token was issued before password change
      if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
        console.warn('Auth Middleware: Token issued before password change');
        return res.status(401).json({ message: 'User recently changed password. Please login again' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.warn('Auth Middleware: Token verification failed', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType.toLowerCase())) {
      res.status(403);
      throw new Error(`User role ${req.user.userType} is not authorized to access this route`);
    }
    next();
  };
};

// Rate limiting middleware
export const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}; 