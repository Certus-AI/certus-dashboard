import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canUserCreateUsers, getAccountUsers } from './actions'
import UsersClient from './users-client'

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Check if user has permission to manage users
  const { canCreate } = await canUserCreateUsers()

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">
          You do not have permission to manage users.
        </p>
        <p className="text-sm text-gray-500">
          Contact your account owner for access.
        </p>
      </div>
    )
  }

  // Fetch all users in the account
  const users = await getAccountUsers()

  return (
    <div className="flex flex-col gap-6 p-8 flex-1 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage users and their access to locations
          </p>
        </div>
      </div>

      {/* Client component with interactive functionality */}
      <UsersClient users={users} />
    </div>
  )
}
