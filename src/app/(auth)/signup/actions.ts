'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type SignupState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const organization = formData.get('organization') as string;

  if (!name || !email || !password) {
    return { error: 'Name, email, and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create account.' };
  }

  // 2. Create profile (uses service role in production, but RLS allows self-insert)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: name,
    });

  if (profileError) {
    console.error('Profile creation error:', profileError.message);
  }

  // 3. If organization name provided, create or join org
  if (organization) {
    // Check if org exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', organization)
      .single();

    if (existingOrg) {
      // Join existing org
      await supabase.from('organization_members').insert({
        organization_id: existingOrg.id,
        user_id: authData.user.id,
        role: 'team_member',
      });
    } else {
      // Create new org
      const slug = organization.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({
          name: organization,
          slug,
          settings: { tier: 'free', features: [] },
        })
        .select('id')
        .single();

      if (newOrg) {
        await supabase.from('organization_members').insert({
          organization_id: newOrg.id,
          user_id: authData.user.id,
          role: 'owner',
        });
      }
    }
  }

  // If email confirmation is required, user needs to verify
  if (authData.user.identities?.length === 0) {
    return { success: true };
  }

  redirect('/console');
}
