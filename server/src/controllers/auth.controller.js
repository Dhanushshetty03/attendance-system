import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { signToken } from '../utils/jwt.js';
import { loginSchema, changePasswordSchema, updateProfileSchema } from '../validators/auth.validator.js';

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        studentProfile: {
          include: { department: true },
        },
        facultyProfile: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User does not exist.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Administrator.' });
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: `User ${user.email} logged in successfully with role ${user.role}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      },
    });

    // Strip password hash
    const { passwordHash, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userSafe,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = req.user;
    const { passwordHash, ...userSafe } = user;

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    res.json({
      success: true,
      user: {
        ...userSafe,
        unreadNotificationsCount: unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const user = req.user;

    const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password provided is incorrect.' });
    }

    const newHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: user.id,
        details: 'User updated their password.',
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const user = req.user;

    if (validated.avatar !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: validated.avatar },
      });
    }

    if (user.role === 'STUDENT' && user.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: user.studentProfile.id },
        data: {
          contactNo: validated.contactNo !== undefined ? validated.contactNo : user.studentProfile.contactNo,
          guardianContact: validated.guardianContact !== undefined ? validated.guardianContact : user.studentProfile.guardianContact,
          guardianName: validated.guardianName !== undefined ? validated.guardianName : user.studentProfile.guardianName,
        },
      });
    } else if (user.role === 'FACULTY' && user.facultyProfile) {
      await prisma.facultyProfile.update({
        where: { id: user.facultyProfile.id },
        data: {
          contactNo: validated.contactNo !== undefined ? validated.contactNo : user.facultyProfile.contactNo,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: { include: { department: true } },
        facultyProfile: { include: { department: true } },
      },
    });

    const { passwordHash, ...userSafe } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userSafe,
    });
  } catch (error) {
    next(error);
  }
}
