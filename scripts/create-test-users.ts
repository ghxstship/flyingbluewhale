/**
 * GVTEWAY Test User Creation Script
 *
 * Creates 11 test users (one per platform role) with:
 * - Supabase auth accounts (email + password)
 * - Profile records
 * - Organization memberships
 * - Project memberships (linked to seeded projects)
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
  role: string;
  projectRole?: string;
}

const TEST_USERS: TestUser[] = [
  { email: 'dev@gvteway.test', fullName: 'Dev User', role: 'developer', projectRole: 'developer' },
  { email: 'owner@gvteway.test', fullName: 'Owner User', role: 'owner', projectRole: 'owner' },
  { email: 'admin@gvteway.test', fullName: 'Admin User', role: 'admin', projectRole: 'admin' },
  { email: 'team@gvteway.test', fullName: 'Team Member', role: 'team_member', projectRole: 'team_member' },
  { email: 'talentmgmt@gvteway.test', fullName: 'Talent Manager', role: 'talent_management', projectRole: 'talent_management' },
  { email: 'performer@gvteway.test', fullName: 'DJ Testificate', role: 'talent_performer', projectRole: 'talent_performer' },
  { email: 'crew@gvteway.test', fullName: 'Crew Member', role: 'talent_crew', projectRole: 'talent_crew' },
  { email: 'vendor@gvteway.test', fullName: 'Vendor User', role: 'vendor', projectRole: 'vendor' },
  { email: 'client@gvteway.test', fullName: 'Client User', role: 'client', projectRole: 'client' },
  { email: 'sponsor@gvteway.test', fullName: 'Sponsor User', role: 'sponsor', projectRole: 'sponsor' },
  { email: 'guest@gvteway.test', fullName: 'Industry Guest', role: 'industry_guest', projectRole: 'industry_guest' },
];

async function createTestUsers() {
  console.log('🔑 Creating 11 test users for GVTEWAY...\n');

  for (const user of TEST_USERS) {
    process.stdout.write(`  Creating ${user.role.padEnd(20)} (${user.email})... `);

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
  console.log(`   Emails:`);
  for (const user of TEST_USERS) {
    console.log(`     ${user.role.padEnd(20)} → ${user.email}`);
  }
}

async function ensureMemberships(userId: string, user: TestUser) {
  // Org membership
  await supabase.from('organization_members').upsert(
    {
      organization_id: ORG_ID,
      user_id: userId,
      role: user.role,
    },
    { onConflict: 'organization_id,user_id' }
  );

  // Project memberships (both seeded projects)
  if (user.projectRole) {
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
}

createTestUsers().catch(console.error);
