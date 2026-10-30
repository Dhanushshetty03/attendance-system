# Testing Strategy & Execution Guide

## 1. Automated Test Suite Summary

The project includes an automated test suite powered by **Vitest**, covering core mathematical models, authorization checks, payload validation schemas, duplicate session prevention, and data aggregation logic.

```
Total Test Suites : 5
Total Passed Tests: 27
Code Coverage     : Calculation models, Zod validators, JWT security, Session constraints, Report shaping
```

---

## 2. Test Suites Breakdown

### 2.1 Attendance Calculations (`tests/calculator.test.js`)
- **`calculateAttendancePercentage`**:
  - Validates percentage rounding to 2 decimal places (e.g. 24/35 = 68.57%, 32/40 = 80%).
  - Tests zero conducted classes edge cases without division-by-zero errors.
  - Tests 100% perfect attendance boundary.
- **`calculateAttendanceStatus`**:
  - Classifies attendance >= 75% as `GOOD`.
  - Classifies attendance between 65% and 74.99% as `LOW`.
  - Classifies attendance < 65% as `CRITICAL` shortage.
- **`calculateTargetClassesNeeded`**:
  - Mathematical verification of $x = \max(0, \lceil \frac{r \cdot t - a}{1 - r} \rceil)$.
  - Verifies Priya's case (24 attended / 35 conducted) requires exactly 9 consecutive classes to hit 75%.
  - Mathematical verification of safe misses $m = \lfloor \frac{a - r \cdot t}{r} \rfloor$.
  - Verifies Rahul's case (32 attended / 40 conducted) allows 2 safe misses while staying >= 75%.
  - Tests edge case of 100% target after a class has been missed (`UNACHIEVABLE`, $\infty$).
  - Tests edge case of zero classes conducted.

### 2.2 Payload Schema Validation (`tests/validation.test.js`)
- **`loginSchema`**: Rejects invalid email formats and passwords below 6 characters.
- **`changePasswordSchema`**: Enforces non-empty current password and minimum length.
- **`markAttendanceSchema`**: Verifies UUID formatting, date regex (`YYYY-MM-DD`), session type enum, and non-empty student array.
- **`correctionRequestSchema`**: Enforces minimum 10-character reason length.
- **`reviewCorrectionSchema`**: Enforces mandatory review remarks and `APPROVED`/`REJECTED` status.

### 2.3 JWT Security & Authentication (`tests/auth.test.js`)
- Verifies standard header-payload-signature structure.
- Verifies identity claims preservation (`userId`, `email`, `role`).
- Verifies distinct token handling for `STUDENT`, `FACULTY`, and `ADMIN`.
- Verifies graceful rejection of tampered, malformed, or empty tokens.

### 2.4 Duplicate Session & Enrollment Checks (`tests/duplicateSession.test.js`)
- Validates duplicate session detection for identical subject, section, date, and hour slot.
- Validates active enrollment requirement before attendance evaluation.

### 2.5 Report Aggregation & Data Shaping (`tests/reports.test.js`)
- Tests subject-wise and semester aggregate attendance calculations.
- Tests exam eligibility status determinations.

---

## 3. How to Execute Tests

To run the automated test suite in single-run mode:
```bash
npm test
```

To run tests in interactive watch mode during development:
```bash
npm run test:watch
```
