import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/overview'

  if (code) {
    const supabase = await createServerSupabaseClient()

    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Check if user has permissions assigned in user_roles_permissions
      const { data: userPermission, error: permissionError } = await supabase
        .from('user_roles_permissions')
        .select('user_id, role_permission_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (permissionError || !userPermission) {
        // User authenticated but has no permissions assigned
        // Sign them out and redirect to login with error
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=no_permissions`)
      }

      // User is authenticated and has permissions, redirect to dashboard
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // If there's an error, redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=authentication_failed`)
}
