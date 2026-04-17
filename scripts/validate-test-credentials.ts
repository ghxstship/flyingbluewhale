/**
 * GVTEWAY Test Credential Validator
 *
 * Validates all 17 test user credentials against a Supabase instance:
 * 1. Signs in with email/password
 * 2. Verifies org membership + platform role
 * 3. Verifies project membership + project role
 *
 * Usage:
 *   LOCAL:  npx tsx scripts/validate-test-credentials.ts local
 *   REMOTE: npx tsx scripts/validate-test-credentials.ts remote
 */

import { createClient } from '@supabase/supabase-js';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const REMOTE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrovijzjbyssajhtwvas.supabase.co';
const REMOTE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const REMOTE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TEST_PASSWORD = 'Test1234!';

const ORG_ID = 'e0000001-0000-0000-0000-0b9a00000001';
const PROJECT_ID_JOINTS = 'a0000001-0000-0000-0000-111101005000';

interface TestUser {
  email: string;
  expectedPlatformRole: string;
  expectedProjectRole: string;
}

const CANONICAL_USERS: TestUser[] = [
  // Platform Roles (Internal)
  { email: 'dev@gvteway.test', expectedPlatformRole: 'developer', expectedProjectRole: 'executive' },
  { email: 'owner@gvteway.test', expectedPlatformRole: 'owner', expectedProjectRole: 'executive' },
  { email: 'admin@gvteway.test', expectedPlatformRole: 'admin', expectedProjectRole: 'executive' },
  { email: 'team@gvteway.test', expectedPlatformRole: 'team_member', expectedProjectRole: 'production' },
  { email: 'collab@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'staff' },
  // Project Roles (External)
  { email: 'exec@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'executive' },
  { email: 'production@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'production' },
  { email: 'mgmt@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'management' },
  { email: 'crew@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'crew' },
  { email: 'staff@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'staff' },
  { email: 'talent@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'talent' },
  { email: 'vendor@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'vendor' },
  { email: 'client@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'client' },
  { email: 'sponsor@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'sponsor' },
  { email: 'press@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'press' },
  { email: 'guest@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'guest' },
  { email: 'attendee@gvteway.test', expectedPlatformRole: 'collaborator', expectedProjectRole: 'attendee' },
];

// All canonical roles that MUST have at least one test user
const ALL_PLATFORM_ROLES = ['developer', 'owner', 'admin', 'team_member', 'collaborator'];
const ALL_PROJECT_ROLES = ['executive', 'production', 'management', 'crew', 'staff', 'talent', 'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee'];

async function validate(target: 'local' | 'remote') {
  const url = target === 'local' ? LOCAL_URL : REMOTE_URL;
  const anonKey = target === 'local' ? LOCAL_ANON_KEY : REMOTE_ANON_KEY;
  const serviceKey = target === 'local' ? LOCAL_SERVICE_KEY : REMOTE_SERVICE_KEY;

  if (!anonKey) {
    console.error(`❌ Missing anon key for ${target}. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.`);
    return false;
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  VALIDATING ${target.toUpperCase()} — ${url}`);
  console.log(`${'═'.repeat(70)}\n`);

  const anonClient = createClient(url, anonKey);
  const serviceClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let passed = 0;
  let failed = 0;
  const errors: string[] = [];
  const seenPlatformRoles = new Set<string>();
  const seenProjectRoles = new Set<string>();

  for (const user of CANONICAL_USERS) {
    const label = `${user.email.padEnd(28)}`;
    const checks: string[] = [];

    // 1. Sign in
    const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: user.email,
      password: TEST_PASSWORD,
    });

    if (signInErr || !signIn.user) {
      checks.push(`AUTH FAIL: ${signInErr?.message || 'no user'}`);
      console.log(`  ❌ ${label} ${checks.join(' | ')}`);
      errors.push(`${user.email}: ${checks.join(' | ')}`);
      failed++;
      await anonClient.auth.signOut();
      continue;
    }

    checks.push('auth ✓');
    const userId = signIn.user.id;

    // 2. Check org membership via service client
    const { data: orgMember } = await serviceClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', ORG_ID)
      .eq('user_id', userId)
      .single();

    if (!orgMember) {
      checks.push('NO ORG MEMBERSHIP');
      console.log(`  ❌ ${label} ${checks.join(' | ')}`);
      errors.push(`${user.email}: missing org membership`);
      failed++;
      await anonClient.auth.signOut();
      continue;
    }

    const platformRole = orgMember.role;
    seenPlatformRoles.add(platformRole);

    if (platformRole === user.expectedPlatformRole) {
      checks.push(`platform:${platformRole} ✓`);
    } else {
      checks.push(`platform:${platformRole} ✗ (expected ${user.expectedPlatformRole})`);
      errors.push(`${user.email}: platform role ${platformRole} != ${user.expectedPlatformRole}`);
    }

    // 3. Check project membership via service client
    const { data: projMember } = await serviceClient
      .from('project_members')
      .select('role')
      .eq('project_id', PROJECT_ID_JOINTS)
      .eq('user_id', userId)
      .single();

    if (!projMember) {
      checks.push('NO PROJECT MEMBERSHIP');
      errors.push(`${user.email}: missing project membership`);
    } else {
      const projectRole = projMember.role;
      seenProjectRoles.add(projectRole);

      if (projectRole === user.expectedProjectRole) {
        checks.push(`project:${projectRole} ✓`);
      } else {
        checks.push(`project:${projectRole} ✗ (expected ${user.expectedProjectRole})`);
        errors.push(`${user.email}: project role ${projectRole} != ${user.expectedProjectRole}`);
      }
    }

    const allPassed = checks.every(c => c.includes('✓'));
    if (allPassed) {
      console.log(`  ✅ ${label} ${checks.join(' | ')}`);
      passed++;
    } else {
      console.log(`  ❌ ${label} ${checks.join(' | ')}`);
      failed++;
    }

    await anonClient.auth.signOut();
  }

  // 4. Coverage check — every canonical role has a test user
  console.log(`\n  ─── Role Coverage ───`);
  const missingPlatform = ALL_PLATFORM_ROLES.filter(r => !seenPlatformRoles.has(r));
  const missingProject = ALL_PROJECT_ROLES.filter(r => !seenProjectRoles.has(r));

  if (missingPlatform.length === 0) {
    console.log(`  ✅ Platform roles: all ${ALL_PLATFORM_ROLES.length} covered`);
  } else {
    console.log(`  ❌ Platform roles MISSING: ${missingPlatform.join(', ')}`);
    errors.push(`Missing platform role coverage: ${missingPlatform.join(', ')}`);
  }

  if (missingProject.length === 0) {
    console.log(`  ✅ Project roles:  all ${ALL_PROJECT_ROLES.length} covered`);
  } else {
    console.log(`  ❌ Project roles MISSING: ${missingProject.join(', ')}`);
    errors.push(`Missing project role coverage: ${missingProject.join(', ')}`);
  }

  // Summary
  console.log(`\n  ─── Summary (${target}) ───`);
  console.log(`  Passed: ${passed}/${CANONICAL_USERS.length}`);
  console.log(`  Failed: ${failed}/${CANONICAL_USERS.length}`);

  if (errors.length > 0) {
    console.log(`\n  ❌ ERRORS:`);
    errors.forEach(e => console.log(`     • ${e}`));
  } else {
    console.log(`\n  ✅ ALL CHECKS PASSED`);
  }

  return errors.length === 0;
}

async function main() {
  const target = process.argv[2] as 'local' | 'remote' | 'both' | undefined;

  if (!target || target === 'both') {
    const localOk = await validate('local');
    const remoteOk = REMOTE_ANON_KEY ? await validate('remote') : (console.log('\n⚠️  Skipping remote — no NEXT_PUBLIC_SUPABASE_ANON_KEY set'), true);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  FINAL: Local ${localOk ? '✅' : '❌'} | Remote ${remoteOk ? '✅' : '❌'}`);
    console.log(`${'═'.repeat(70)}\n`);

    process.exit(localOk && remoteOk ? 0 : 1);
  } else {
    const ok = await validate(target);
    process.exit(ok ? 0 : 1);
  }
}

main().catch(console.error);
