import { describe, it, expect } from 'vitest';
import { can, canAny, getCapabilities, PLATFORM_ROLE_CAPABILITIES } from './capabilities';
import type { PlatformRole } from '../supabase/types';

describe('RBAC Capabilities Matrix', () => {
  describe('can()', () => {
    it('returns true when role has capability', () => {
      // Admin should have projects:read (since it inherits all except billing)
      expect(can('admin', 'projects:read')).toBe(true);
      expect(can('team_member', 'projects:create')).toBe(true);
    });

    it('returns false when role lacks capability', () => {
      expect(can('team_member', 'billing:manage')).toBe(false);
      expect(can('collaborator', 'projects:create')).toBe(false);
    });

    it('returns false for unknown capabilities', () => {
      // @ts-expect-error Testing invalid capability
      expect(can('admin', 'unknown:manage')).toBe(false);
    });

    it('returns false for unknown roles', () => {
      expect(can('unknown_role' as PlatformRole, 'projects:read')).toBe(false);
    });
  });

  describe('canAny()', () => {
    it('returns true if role has at least one in the list', () => {
      // Team member has projects:read but not billing:manage
      expect(canAny('team_member', ['projects:read', 'billing:manage'])).toBe(true);
    });

    it('returns false if role has none in the list', () => {
      expect(canAny('collaborator', ['projects:create', 'billing:manage'])).toBe(false);
    });

    it('returns false for empty list', () => {
      expect(canAny('admin', [])).toBe(false);
    });
  });

  describe('getCapabilities()', () => {
    it('returns array of capabilities for valid role', () => {
      const caps = getCapabilities('team_member');
      expect(caps).toBeInstanceOf(Array);
      expect(caps).toContain('projects:read');
    });

    it('returns empty array for invalid role', () => {
      const caps = getCapabilities('invalid_role' as PlatformRole);
      expect(caps).toEqual([]);
    });
  });

  describe('Strict Canonical Alignments', () => {
    it('verifies developer role is unrestrained', () => {
      // Developer has ALL capabilities
      const devCaps = getCapabilities('developer');
      const ownerCaps = getCapabilities('owner');
      expect(devCaps.length).toEqual(ownerCaps.length);
      expect(can('developer', 'billing:manage')).toBe(true);
    });

    it('enforces that admin cannot manage billing', () => {
      expect(can('admin', 'billing:manage')).toBe(false);
    });

    it('verifies no legacy roles exist in PLATFORM_ROLE_CAPABILITIES', () => {
      // Ensure 'controller', 'viewer', 'community', 'contractor' are fully stripped
      expect(PLATFORM_ROLE_CAPABILITIES).not.toHaveProperty('controller');
      expect(PLATFORM_ROLE_CAPABILITIES).not.toHaveProperty('viewer');
      expect(PLATFORM_ROLE_CAPABILITIES).not.toHaveProperty('community');
      expect(PLATFORM_ROLE_CAPABILITIES).not.toHaveProperty('contractor');
    });
  });
});
