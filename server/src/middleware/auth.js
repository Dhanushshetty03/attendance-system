import { verifyToken } from '../utils/jwt.js';
import prisma from '../prisma.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: {
          include: { department: true },
        },
        facultyProfile: {
          include: { department: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed due to internal error.' });
  }
}

export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}
