/**
 * Attendance Calculation Utility for Logisys Smart Attendance System
 *
 * Formula:
 * Attendance Percentage = (Classes Attended / Total Classes Conducted) * 100
 *
 * For a target attendance rate r (as decimal e.g. 0.75 for 75%),
 * current attended classes a, and conducted classes t:
 *
 * Minimum additional consecutive classes x needed to achieve target:
 * x = max(0, ceil((r * t - a) / (1 - r)))
 *
 * If current attendance is already >= target, how many classes can the student miss (bunk)?
 * (a) / (t + m) >= r  =>  a >= r * (t + m)  =>  r * m <= a - r * t  =>  m = floor((a - r * t) / r)
 */

export function calculateAttendancePercentage(attended, conducted) {
  if (!conducted || conducted <= 0) return 0;
  const pct = (attended / conducted) * 100;
  return Math.round(pct * 100) / 100; // 2 decimal places
}

export function calculateAttendanceStatus(percentage, threshold = 75, criticalThreshold = 65) {
  if (percentage >= threshold) return 'GOOD';
  if (percentage >= criticalThreshold) return 'LOW';
  return 'CRITICAL';
}

export function calculateTargetClassesNeeded(attended, conducted, targetRateDecimal = 0.75) {
  const a = Number(attended) || 0;
  const t = Number(conducted) || 0;
  const r = Number(targetRateDecimal);

  // If no classes have taken place yet
  if (t === 0) {
    return {
      classesNeeded: 0,
      classesCanMiss: 0,
      currentPercentage: 0,
      targetPercentage: r * 100,
      status: 'ON_TRACK',
      message: 'No classes have been conducted yet.',
    };
  }

  const currentPercentage = calculateAttendancePercentage(a, t);
  const targetPct = r * 100;

  // Handle edge case: target is 100% (r = 1.0)
  if (r >= 1.0) {
    if (a < t) {
      return {
        classesNeeded: Infinity,
        classesCanMiss: 0,
        currentPercentage,
        targetPercentage: 100,
        status: 'UNACHIEVABLE',
        message: 'A 100% attendance rate cannot be attained once any class has been missed.',
      };
    } else {
      return {
        classesNeeded: 0,
        classesCanMiss: 0,
        currentPercentage: 100,
        targetPercentage: 100,
        status: 'ON_TRACK',
        message: 'You currently have a 100% perfect attendance record.',
      };
    }
  }

  // Standard case: r < 1.0
  const numerator = r * t - a;
  const denominator = 1 - r;

  if (numerator > 0) {
    // Attendance is currently below target
    const classesNeeded = Math.ceil(numerator / denominator);
    return {
      classesNeeded,
      classesCanMiss: 0,
      currentPercentage,
      targetPercentage: targetPct,
      status: 'BELOW_TARGET',
      message: `You must attend the next ${classesNeeded} consecutive class${classesNeeded > 1 ? 'es' : ''} to reach ${targetPct}%.`,
    };
  } else {
    // Attendance is currently at or above target
    // Classes student can miss while staying >= r: floor((a - r * t) / r)
    const canMiss = Math.floor((a - r * t) / r);
    return {
      classesNeeded: 0,
      classesCanMiss: Math.max(0, canMiss),
      currentPercentage,
      targetPercentage: targetPct,
      status: 'ON_TRACK',
      message: canMiss > 0
        ? `You can safely miss up to ${canMiss} class${canMiss > 1 ? 'es' : ''} while maintaining at least ${targetPct}%.`
        : `You are exactly on target at ${currentPercentage}%. Do not miss any upcoming classes.`,
    };
  }
}
