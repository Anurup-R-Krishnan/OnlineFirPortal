import { describe, expect, it } from '@jest/globals';
import {
  ACCESS_CONTROL_MATRIX,
  canAccessFIR,
  canAccessRoute,
  getAccessControlPolicy,
  hasPermission,
} from '../../../src/lib/access-control';

describe('access control policy', () => {
  it('defines at least three subjects and three objects for the lab rubric', () => {
    const policy = getAccessControlPolicy();

    expect(Object.keys(policy).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(ACCESS_CONTROL_MATRIX.CITIZEN).length).toBeGreaterThanOrEqual(3);
  });

  it('allows citizens to create FIRs but not generate reports', () => {
    expect(hasPermission('CITIZEN', 'fir', 'create')).toBe(true);
    expect(hasPermission('CITIZEN', 'reports', 'generate')).toBe(false);
  });

  it('allows SHOs to assign FIRs', () => {
    expect(hasPermission('SHO', 'fir', 'assign')).toBe(true);
  });

  it('enforces FIR ownership for citizens', () => {
    expect(canAccessFIR('CITIZEN', 'user-1', 'user-1', 'read').allowed).toBe(true);
    expect(canAccessFIR('CITIZEN', 'user-1', 'user-2', 'read').allowed).toBe(false);
  });

  it('maps routes to the correct roles', () => {
    expect(canAccessRoute('CITIZEN', '/file-fir')).toBe(true);
    expect(canAccessRoute('OFFICER', '/file-fir')).toBe(false);
    expect(canAccessRoute('ADMIN', '/admin')).toBe(true);
  });

  it('denies citizens the SHO-only assign action (privilege escalation)', () => {
    expect(hasPermission('CITIZEN', 'fir', 'assign')).toBe(false);
    expect(canAccessFIR('CITIZEN', 'user-1', 'user-1', 'assign').allowed).toBe(false);
  });

  it('denies officers the SHO-only assign action', () => {
    expect(hasPermission('OFFICER', 'fir', 'assign')).toBe(false);
  });

  it('rejects unknown roles entirely', () => {
    const intruder = 'INTRUDER' as never;
    expect(hasPermission(intruder, 'fir', 'read')).toBe(false);
    expect(hasPermission(intruder, 'fir', 'create')).toBe(false);
    expect(hasPermission(intruder, 'documents', 'upload')).toBe(false);
    expect(canAccessFIR(intruder, 'user-1', 'user-1', 'read').allowed).toBe(false);
    expect(canAccessRoute(intruder, '/dashboard')).toBe(false);
    expect(canAccessRoute(intruder, '/admin')).toBe(false);
  });

  it('gates administrative routes to administrators', () => {
    expect(canAccessRoute('CITIZEN', '/admin')).toBe(false);
    expect(canAccessRoute('OFFICER', '/admin')).toBe(false);
    expect(canAccessRoute('SHO', '/admin')).toBe(false);
    expect(canAccessRoute('ADMIN', '/admin')).toBe(true);
    expect(canAccessRoute('SUPER_ADMIN', '/admin')).toBe(true);
  });
});
