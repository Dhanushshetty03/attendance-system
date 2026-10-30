import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const updateProfileSchema = z.object({
  contactNo: z.string().optional(),
  guardianContact: z.string().optional(),
  guardianName: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});
