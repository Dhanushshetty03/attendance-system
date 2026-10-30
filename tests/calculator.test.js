import { describe, it, expect } from 'vitest';
import {
  calculateAttendancePercentage,
  calculateAttendanceStatus,
  calculateTargetClassesNeeded,
} from '../server/src/utils/calculator.js';

describe('Attendance Percentage Calculation', () => {
  it('calculates standard percentages correctly', () => {
    expect(calculateAttendancePercentage(32, 40)).toBe(80);
    expect(calculateAttendancePercentage(24, 35)).toBe(68.57);
    expect(calculateAttendancePercentage(36, 40)).toBe(90);
  });

  it('handles zero conducted classes gracefully without division by zero', () => {
    expect(calculateAttendancePercentage(0, 0)).toBe(0);
    expect(calculateAttendancePercentage(5, 0)).toBe(0);
    expect(calculateAttendancePercentage(0, -1)).toBe(0);
  });

  it('handles 100% perfect attendance', () => {
    expect(calculateAttendancePercentage(20, 20)).toBe(100);
  });
});

describe('Attendance Status Classification', () => {
  it('identifies GOOD attendance at or above 75%', () => {
    expect(calculateAttendanceStatus(75)).toBe('GOOD');
    expect(calculateAttendanceStatus(85)).toBe('GOOD');
    expect(calculateAttendanceStatus(100)).toBe('GOOD');
  });

  it('identifies LOW attendance between 65% and 74.99%', () => {
    expect(calculateAttendanceStatus(74.99)).toBe('LOW');
    expect(calculateAttendanceStatus(68.57)).toBe('LOW');
    expect(calculateAttendanceStatus(65)).toBe('LOW');
  });

  it('identifies CRITICAL shortage below 65%', () => {
    expect(calculateAttendanceStatus(64.99)).toBe('CRITICAL');
    expect(calculateAttendanceStatus(50)).toBe('CRITICAL');
    expect(calculateAttendanceStatus(0)).toBe('CRITICAL');
  });
});

describe('Target Attendance Formula & Calculator (x = max(0, ceil((r*t - a)/(1-r))))', () => {
  it('calculates exact classes needed when below target (e.g. Priya 24/35 needing 75%)', () => {
    // a = 24, t = 35, r = 0.75
    // numerator = 0.75 * 35 - 24 = 26.25 - 24 = 2.25
    // denominator = 1 - 0.75 = 0.25
    // x = ceil(2.25 / 0.25) = ceil(9) = 9 classes
    const res = calculateTargetClassesNeeded(24, 35, 0.75);
    expect(res.classesNeeded).toBe(9);
    expect(res.classesCanMiss).toBe(0);
    expect(res.status).toBe('BELOW_TARGET');

    // Verify verification: (24 + 9) / (35 + 9) = 33 / 44 = 0.75 = 75.0%
    const verifiedPct = (33 / 44) * 100;
    expect(verifiedPct).toBeGreaterThanOrEqual(75);
  });

  it('calculates safe bunk misses when above target (e.g. Rahul 32/40 with 75% target)', () => {
    // a = 32, t = 40, r = 0.75
    // Can miss m = floor((32 - 0.75 * 40) / 0.75) = floor((32 - 30) / 0.75) = floor(2 / 0.75) = 2
    const res = calculateTargetClassesNeeded(32, 40, 0.75);
    expect(res.classesNeeded).toBe(0);
    expect(res.classesCanMiss).toBe(2);
    expect(res.status).toBe('ON_TRACK');

    // Verify verification: 32 / (40 + 2) = 32 / 42 = 76.19% >= 75%
    expect((32 / 42) * 100).toBeGreaterThanOrEqual(75);
  });

  it('handles edge case when target is 100% and student has missed classes', () => {
    const res = calculateTargetClassesNeeded(19, 20, 1.0);
    expect(res.status).toBe('UNACHIEVABLE');
    expect(res.classesNeeded).toBe(Infinity);
  });

  it('handles edge case when target is 100% and student has not missed any class', () => {
    const res = calculateTargetClassesNeeded(20, 20, 1.0);
    expect(res.status).toBe('ON_TRACK');
    expect(res.classesNeeded).toBe(0);
  });

  it('handles zero conducted classes', () => {
    const res = calculateTargetClassesNeeded(0, 0, 0.75);
    expect(res.classesNeeded).toBe(0);
    expect(res.classesCanMiss).toBe(0);
  });
});
