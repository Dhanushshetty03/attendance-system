import { z } from 'zod';

export const markAttendanceSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  sectionId: z.string().uuid('Invalid section ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  topicCovered: z.string().optional(),
  sessionType: z.enum(['REGULAR', 'LAB', 'TUTORIAL', 'REMEDIAL']).default('REGULAR'),
  records: z.array(
    z.object({
      studentId: z.string().uuid('Invalid student ID'),
      status: z.enum(['PRESENT', 'ABSENT', 'LEAVE']),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, 'At least one student attendance record must be provided'),
});

export const updateAttendanceSchema = z.object({
  records: z.array(
    z.object({
      recordId: z.string().uuid('Invalid attendance record ID'),
      status: z.enum(['PRESENT', 'ABSENT', 'LEAVE']),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, 'At least one student attendance record must be provided'),
  auditReason: z.string().min(5, 'Reason for modifying attendance is required for audit trails'),
});

export const correctionRequestSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  requestedStatus: z.enum(['PRESENT', 'LEAVE']),
  reason: z.string().min(10, 'Please provide a detailed explanation of at least 10 characters'),
  proofDocUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const reviewCorrectionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewRemarks: z.string().min(3, 'Review remarks are mandatory'),
});

export const targetCalculationSchema = z.object({
  targetPercentage: z.number().min(1).max(100).default(75),
});
