/**
 * GVTEWAY Test User Creation Script
 *
 * Creates 17 test users across the two-tier RBAC system:
 * - 5 Platform Roles (org-scoped): developer, owner, admin, team_member, collaborator
 * - 12 Project Roles (project-scoped): executive, production, management, crew, staff,
 *   talent, vendor, client, sponsor, press, guest, attendee
 *
 * Each user gets:
 * - Supabase auth account (email + password)
 * - Profile record
 * - Organization membership (platform role)
 * - Project memberships (project role on both seeded projects)
 *
 * Usage: npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrovijzjbyssajhtwvas.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = 'e0000001-0000-0000-0000-0b9a00000001'; // GHXSTSHIP org from migration 011
const PROJECT_ID_JOINTS = 'a0000001-0000-0000-0000-111101005000'; // iii Joints 2026
const PROJECT_ID_SALVAGE = 'a0000002-0000-0000-0000-5a1a9ec17200'; // Salvage City

const TEST_PASSWORD = 'Test1234!';

interface TestUser {
  email: string;
  fullName: string;
  platformRole: string;  // org-scoped
  projectRole: string;   // project-scoped
}

const TEST_USERS: TestUser[] = [
  // ─── Platform Roles (Internal) ───
  { email: 'dev@gvteway.test', fullName: 'Dev User', platformRole: 'developer', projectRole: 'executive' },
  { email: 'owner@gvteway.test', fullName: 'Owner User', platformRole: 'owner', projectRole: 'executive' },
  { email: 'admin@gvteway.test', fullName: 'Admin User', platformRole: 'admin', projectRole: 'executive' },
  { email: 'team@gvteway.test', fullName: 'Team Member', platformRole: 'team_member', projectRole: 'production' },
  { email: 'collab@gvteway.test', fullName: 'Collaborator User', platformRole: 'collaborator', projectRole: 'staff' },

  // ─── Project Roles (External) ───
  { email: 'exec@gvteway.test', fullName: 'Executive User', platformRole: 'collaborator', projectRole: 'executive' },
  { email: 'production@gvteway.test', fullName: 'Production Lead', platformRole: 'collaborator', projectRole: 'production' },
  { email: 'mgmt@gvteway.test', fullName: 'Management User', platformRole: 'collaborator', projectRole: 'management' },
  { email: 'crew@gvteway.test', fullName: 'Crew Member', platformRole: 'collaborator', projectRole: 'crew' },
  { email: 'staff@gvteway.test', fullName: 'Staff Member', platformRole: 'collaborator', projectRole: 'staff' },
  { email: 'talent@gvteway.test', fullName: 'DJ Testificate', platformRole: 'collaborator', projectRole: 'talent' },
  { email: 'vendor@gvteway.test', fullName: 'Vendor User', platformRole: 'collaborator', projectRole: 'vendor' },
  { email: 'client@gvteway.test', fullName: 'Client User', platformRole: 'collaborator', projectRole: 'client' },
  { email: 'sponsor@gvteway.test', fullName: 'Sponsor User', platformRole: 'collaborator', projectRole: 'sponsor' },
  { email: 'press@gvteway.test', fullName: 'Press User', platformRole: 'collaborator', projectRole: 'press' },
  { email: 'guest@gvteway.test', fullName: 'Guest User', platformRole: 'collaborator', projectRole: 'guest' },
  { email: 'attendee@gvteway.test', fullName: 'Attendee User', platformRole: 'collaborator', projectRole: 'attendee' },
];

async function createTestUsers() {
  console.log(`🔑 Creating ${TEST_USERS.length} test users for GVTEWAY...\n`);
  console.log('  Platform Role (org)  │ Project Role          │ Email');
  console.log('  ─────────────────────┼───────────────────────┼──────────────────────');

  for (const user of TEST_USERS) {
    process.stdout.write(`  ${user.platformRole.padEnd(21)}│ ${user.projectRole.padEnd(22)}│ ${user.email}... `);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: { full_name: user.fullName },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // User exists — fetch their ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === user.email);
        if (existing) {
          console.log('exists ✓');
          await ensureMemberships(existing.id, user);
          continue;
        }
      }
      console.log(`FAILED: ${authError.message}`);
      continue;
    }

    if (!authData.user) {
      console.log('FAILED: no user returned');
      continue;
    }

    const userId = authData.user.id;

    // 2. Create profile
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: user.fullName,
    });

    // 3. Create org membership + project memberships
    await ensureMemberships(userId, user);

    console.log('created ✓');
  }

  console.log('\n✅ Done! All test users ready.');
  console.log(`\n📋 Login credentials:`);
  console.log(`   Password for all users: ${TEST_PASSWORD}`);
  console.log(`\n   Platform (Internal):`);
  for (const user of TEST_USERS.filter(u => u.platformRole !== 'collaborator')) {
    console.log(`     ${user.platformRole.padEnd(15)} → ${user.email}`);
  }
  console.log(`\n   Project (External):`);
  for (const user of TEST_USERS.filter(u => u.platformRole === 'collaborator')) {
    console.log(`     ${user.projectRole.padEnd(15)} → ${user.email}`);
  }
}

async function ensureMemberships(userId: string, user: TestUser) {
  // Org membership (platform role)
  await supabase.from('organization_members').upsert(
    {
      organization_id: ORG_ID,
      user_id: userId,
      role: user.platformRole,
    },
    { onConflict: 'organization_id,user_id' }
  );

  // Project memberships (project role — both seeded projects)
  for (const projectId of [PROJECT_ID_JOINTS, PROJECT_ID_SALVAGE]) {
    await supabase.from('project_members').upsert(
      {
        project_id: projectId,
        user_id: userId,
        role: user.projectRole,
      },
      { onConflict: 'project_id,user_id' }
    );
  }
}

createTestUsers().catch(console.error);
