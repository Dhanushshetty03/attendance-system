import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../server/src/utils/jwt.js';

describe('JWT Authentication & Security', () => {
  it('signs and verifies a valid user token successfully', () => {
    const payload = {
      userId: 'student-test-uuid-1234',
      email: 'student.rahul@logisys.edu',
      role: 'STUDENT',
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // Standard header.payload.signature

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('verifies distinct roles for FACULTY and ADMIN', () => {
    const facultyToken = signToken({ userId: 'fac-1', email: 'sharma@logisys.edu', role: 'FACULTY' });
    const adminToken = signToken({ userId: 'adm-1', email: 'admin@logisys.edu', role: 'ADMIN' });

    expect(verifyToken(facultyToken).role).toBe('FACULTY');
    expect(verifyToken(adminToken).role).toBe('ADMIN');
  });

  it('rejects tampered or malformed tokens safely without crashing', () => {
    expect(verifyToken('invalid.token.structure')).toBeNull();
    expect(verifyToken('')).toBeNull();
    expect(verifyToken(null)).toBeNull();

    // Tamper with valid token payload
    const token = signToken({ userId: 'user-1', role: 'STUDENT' });
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}xyz.${parts[2]}`;
    expect(verifyToken(tampered)).toBeNull();
  });
});
