import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to overview
  if (user) {
    redirect('/overview')
  }

  // If not logged in, redirect to login
  redirect('/login')
}
