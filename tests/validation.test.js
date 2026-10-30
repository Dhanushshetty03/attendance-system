import { describe, it, expect } from 'vitest';
import { loginSchema, changePasswordSchema } from '../server/src/validators/auth.validator.js';
import {
  markAttendanceSchema,
  correctionRequestSchema,
  reviewCorrectionSchema,
} from '../server/src/validators/attendance.validator.js';

describe('Auth Validation Schemas', () => {
  it('accepts valid login payloads', () => {
    const valid = { email: 'student.rahul@logisys.edu', password: 'Student@123' };
    expect(() => loginSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid email formats', () => {
    const invalid = { email: 'not-an-email', password: 'Student@123' };
    expect(() => loginSchema.parse(invalid)).toThrow();
  });

  it('rejects short passwords under 6 characters', () => {
    const invalid = { email: 'student.rahul@logisys.edu', password: '123' };
    expect(() => loginSchema.parse(invalid)).toThrow();
  });

  it('validates password change requirements', () => {
    expect(() =>
      changePasswordSchema.parse({ currentPassword: 'Old@123', newPassword: 'NewPassword@123' })
    ).not.toThrow();

    expect(() =>
      changePasswordSchema.parse({ currentPassword: '', newPassword: 'NewPassword@123' })
    ).toThrow();
  });
});

describe('Attendance Validation Schemas', () => {
  const dummyUUID1 = 'a0000000-0000-0000-0000-000000000001';
  const dummyUUID2 = 'b0000000-0000-0000-0000-000000000002';
  const dummyUUID3 = 'c0000000-0000-0000-0000-000000000003';

  it('accepts valid attendance marking submission', () => {
    const validPayload = {
      subjectId: dummyUUID1,
      sectionId: dummyUUID2,
      date: '2026-10-30',
      timeSlot: '09:00 - 10:00',
      topicCovered: 'Graph Algorithms & Minimum Spanning Trees',
      sessionType: 'REGULAR',
      records: [
        { studentId: dummyUUID3, status: 'PRESENT', remarks: null },
      ],
    };
    expect(() => markAttendanceSchema.parse(validPayload)).not.toThrow();
  });

  it('rejects attendance submission without any student records', () => {
    const emptyPayload = {
      subjectId: dummyUUID1,
      sectionId: dummyUUID2,
      date: '2026-10-30',
      timeSlot: '09:00 - 10:00',
      records: [],
    };
    expect(() => markAttendanceSchema.parse(emptyPayload)).toThrow();
  });

  it('rejects invalid date format', () => {
    const invalidDate = {
      subjectId: dummyUUID1,
      sectionId: dummyUUID2,
      date: '30/10/2026', // invalid, must be YYYY-MM-DD
      timeSlot: '09:00 - 10:00',
      records: [{ studentId: dummyUUID3, status: 'PRESENT' }],
    };
    expect(() => markAttendanceSchema.parse(invalidDate)).toThrow();
  });

  it('validates correction request reason length', () => {
    const valid = {
      sessionId: dummyUUID1,
      requestedStatus: 'PRESENT',
      reason: 'Attended the state collegiate hackathon representing the department with OD approval.',
    };
    expect(() => correctionRequestSchema.parse(valid)).not.toThrow();

    const tooShort = {
      sessionId: dummyUUID1,
      requestedStatus: 'PRESENT',
      reason: 'sick', // under 10 chars
    };
    expect(() => correctionRequestSchema.parse(tooShort)).toThrow();
  });

  it('validates admin review decision', () => {
    const approved = { status: 'APPROVED', reviewRemarks: 'Verified with proctor office.' };
    expect(() => reviewCorrectionSchema.parse(approved)).not.toThrow();

    const invalidStatus = { status: 'MAYBE', reviewRemarks: 'Unsure' };
    expect(() => reviewCorrectionSchema.parse(invalidStatus)).toThrow();
  });
});
