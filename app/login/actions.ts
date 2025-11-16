'use server'

import { createClient } from '@supabase/supabase-js'

export async function checkUserExists(email: string): Promise<{ exists: boolean; hasPermissions: boolean }> {
  // Create admin client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Check if user exists in auth.users using admin API
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error checking user:', error)
    throw new Error('Unable to verify user')
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    return { exists: false, hasPermissions: false }
  }

  // Check if user has permissions
  const { data: userPermission } = await supabase
    .from('user_roles_permissions')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    exists: true,
    hasPermissions: !!userPermission
  }
}
