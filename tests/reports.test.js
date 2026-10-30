import { describe, it, expect } from 'vitest';
import { calculateAttendancePercentage } from '../server/src/utils/calculator.js';

describe('Attendance Reports & Matrix Data Shaping', () => {
  it('shapes class matrix calculations accurately', () => {
    const studentRecords = [
      { studentId: 's1', status: 'PRESENT' },
      { studentId: 's1', status: 'PRESENT' },
      { studentId: 's1', status: 'ABSENT' },
      { studentId: 's1', status: 'PRESENT' },
    ];

    const conducted = studentRecords.length;
    const attended = studentRecords.filter((r) => r.status === 'PRESENT').length;
    const missed = studentRecords.filter((r) => r.status === 'ABSENT').length;
    const pct = calculateAttendancePercentage(attended, conducted);

    expect(conducted).toBe(4);
    expect(attended).toBe(3);
    expect(missed).toBe(1);
    expect(pct).toBe(75);
    expect(pct >= 75).toBe(true); // Eligible
  });

  it('correctly aggregates multiple course attendance for student semester summary', () => {
    const subjectAttendance = [
      { code: 'CS501', attended: 32, conducted: 40 }, // 80%
      { code: 'CS502', attended: 24, conducted: 35 }, // 68.57%
      { code: 'CS503', attended: 36, conducted: 40 }, // 90%
    ];

    const totalAttended = subjectAttendance.reduce((acc, curr) => acc + curr.attended, 0);
    const totalConducted = subjectAttendance.reduce((acc, curr) => acc + curr.conducted, 0);
    const overallPct = calculateAttendancePercentage(totalAttended, totalConducted);

    expect(totalAttended).toBe(92);
    expect(totalConducted).toBe(115);
    expect(overallPct).toBe(80);
  });
});
