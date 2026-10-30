import { describe, it, expect } from 'vitest';

describe('Duplicate Session Prevention & Enrollment Constraints', () => {
  it('detects and flags duplicate sessions for identical subject, section, date, and slot', () => {
    const existingSessions = [
      {
        subjectId: 'sub-1',
        sectionId: 'sec-1',
        date: '2026-10-30',
        timeSlot: '09:00 - 10:00',
      },
    ];

    const isDuplicate = (candidate) => {
      return existingSessions.some(
        (s) =>
          s.subjectId === candidate.subjectId &&
          s.sectionId === candidate.sectionId &&
          s.date === candidate.date &&
          s.timeSlot === candidate.timeSlot
      );
    };

    // Candidate with same parameters
    const duplicateCandidate = {
      subjectId: 'sub-1',
      sectionId: 'sec-1',
      date: '2026-10-30',
      timeSlot: '09:00 - 10:00',
    };
    expect(isDuplicate(duplicateCandidate)).toBe(true);

    // Candidate with different time slot
    const validCandidateDiffSlot = {
      subjectId: 'sub-1',
      sectionId: 'sec-1',
      date: '2026-10-30',
      timeSlot: '10:00 - 11:00',
    };
    expect(isDuplicate(validCandidateDiffSlot)).toBe(false);

    // Candidate with different date
    const validCandidateDiffDate = {
      subjectId: 'sub-1',
      sectionId: 'sec-1',
      date: '2026-10-31',
      timeSlot: '09:00 - 10:00',
    };
    expect(isDuplicate(validCandidateDiffDate)).toBe(false);
  });

  it('validates that student is actively enrolled before recording attendance', () => {
    const activeEnrollments = new Set(['student-1-sub-1', 'student-2-sub-1']);

    const isEnrolled = (studentId, subjectId) => {
      return activeEnrollments.has(`${studentId}-${subjectId}`);
    };

    expect(isEnrolled('student-1', 'sub-1')).toBe(true);
    expect(isEnrolled('student-3', 'sub-1')).toBe(false);
  });
});
