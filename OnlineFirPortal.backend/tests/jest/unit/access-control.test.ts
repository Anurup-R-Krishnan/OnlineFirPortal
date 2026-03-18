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
});
