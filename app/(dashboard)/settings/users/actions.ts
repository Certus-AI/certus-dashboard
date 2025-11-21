'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Check if current user has permission to create users
 */
export async function canUserCreateUsers(): Promise<{ canCreate: boolean; userRoleId: number | null }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { canCreate: false, userRoleId: null }
  }

  // Get user's role
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles_permissions')
    .select(`
      role_permission_id,
      roles_permissions!inner (
        role_id,
        permission_ids
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (roleError || !userRole) {
    return { canCreate: false, userRoleId: null }
  }

  const userRoleId = userRole.roles_permissions.role_id

  // Get user's account (to check account settings)
  const { data: userLocations } = await supabase
    .from('user_location_access')
    .select('account_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!userLocations) {
    return { canCreate: false, userRoleId }
  }

  // Check account settings for user creation permission level
  const { data: accountSettings } = await supabase
    .from('account_settings')
    .select('user_creation_permission_level')
    .eq('account_id', userLocations.account_id)
    .maybeSingle()

  const requiredRoleId = accountSettings?.user_creation_permission_level ?? 5 // Default: only owners

  return {
    canCreate: userRoleId >= requiredRoleId,
    userRoleId
  }
}

/**
 * Get all role permission sets that current user can assign to new users
 */
export async function getCreatableRoles() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get current user's permissions
  const { data: currentUserRole } = await supabase
    .from('user_roles_permissions')
    .select(`
      roles_permissions!inner (
        permission_ids
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!currentUserRole) {
    throw new Error('User role not found')
  }

  const currentUserPermissions = currentUserRole.roles_permissions.permission_ids

  // Get all available role permission sets
  const { data: allRoles, error } = await supabase
    .from('roles_permissions')
    .select(`
      role_permission_id,
      name,
      description,
      permission_ids,
      role_id,
      roles!inner (
        name,
        description
      )
    `)
    .order('role_id', { ascending: true })

  if (error) {
    throw new Error('Failed to fetch roles')
  }

  // Filter to only roles where all target permissions are subset of creator's permissions
  const creatableRoles = allRoles.filter(role =>
    role.permission_ids.every(p => currentUserPermissions.includes(p))
  )

  return creatableRoles.map(role => ({
    rolePermissionId: role.role_permission_id,
    name: role.name,
    description: role.description,
    roleName: role.roles.name,
    roleId: role.role_id,
    permissionIds: role.permission_ids
  }))
}

/**
 * Get all locations that current user can assign new users to
 */
export async function getAssignableLocations() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user's accessible locations
  const { data: userLocations, error } = await supabase
    .from('user_location_access')
    .select(`
      location_id,
      account_id,
      locations!inner (
        location_id,
        name,
        certus_notification_email
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to fetch locations')
  }

  return userLocations.map(ul => ({
    locationId: ul.location_id,
    locationName: ul.locations.name,
    accountId: ul.account_id
  }))
}

/**
 * Create a new user with specified role and location access
 */
export async function createUser(
  email: string,
  rolePermissionId: number,
  locationIds: string[],
  fullName?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // 1. Check if user can create users
    const { canCreate } = await canUserCreateUsers()
    if (!canCreate) {
      return { success: false, error: 'You do not have permission to create users' }
    }

    // 2. Get current user's permissions
    const { data: creatorRole } = await supabase
      .from('user_roles_permissions')
      .select(`
        roles_permissions!inner (
          permission_ids
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!creatorRole) {
      return { success: false, error: 'Creator role not found' }
    }

    // 3. Get target role's permissions
    const { data: targetRole } = await supabase
      .from('roles_permissions')
      .select('permission_ids, role_id')
      .eq('role_permission_id', rolePermissionId)
      .single()

    if (!targetRole) {
      return { success: false, error: 'Target role not found' }
    }

    // 4. VALIDATE: Can creator assign this role? (Permission array check)
    const creatorPermissions = creatorRole.roles_permissions.permission_ids
    const targetPermissions = targetRole.permission_ids

    const canAssignRole = targetPermissions.every(p => creatorPermissions.includes(p))

    if (!canAssignRole) {
      return {
        success: false,
        error: 'You do not have sufficient permissions to create users with this role'
      }
    }

    // 5. Validate location access
    const { data: creatorLocations } = await supabase
      .from('user_location_access')
      .select('location_id, account_id')
      .eq('user_id', user.id)

    const creatorLocationIds = creatorLocations?.map(l => l.location_id) || []
    const accountId = creatorLocations?.[0]?.account_id

    if (!accountId) {
      return { success: false, error: 'Creator account not found' }
    }

    // Ensure creator has access to all specified locations
    const invalidLocations = locationIds.filter(locId => !creatorLocationIds.includes(locId))
    if (invalidLocations.length > 0) {
      return {
        success: false,
        error: 'You do not have access to some of the specified locations'
      }
    }

    // 6. Check if user already exists
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.find(u => u.email?.toLowerCase() === normalizedEmail)

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' }
    }

    // 7. Create user in auth.users
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: fullName || null,
        created_by: user.id,
        created_at: new Date().toISOString()
      }
    })

    if (createError || !newUserData.user) {
      console.error('Failed to create user in auth:', createError)
      return { success: false, error: 'Failed to create user account' }
    }

    const newUserId = newUserData.user.id

    // 8. Assign role permission
    const { error: roleError } = await supabase
      .from('user_roles_permissions')
      .insert({
        user_id: newUserId,
        role_permission_id: rolePermissionId
      })

    if (roleError) {
      console.error('Failed to assign role:', roleError)
      // Rollback: delete created user
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return { success: false, error: 'Failed to assign role to user' }
    }

    // 9. Assign location access
    const locationAccessRows = locationIds.map(locationId => ({
      user_id: newUserId,
      location_id: locationId,
      account_id: accountId,
      created_by: user.id
    }))

    const { error: locationError } = await supabase
      .from('user_location_access')
      .insert(locationAccessRows)

    if (locationError) {
      console.error('Failed to assign locations:', locationError)
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      await supabase.from('user_roles_permissions').delete().eq('user_id', newUserId)
      return { success: false, error: 'Failed to assign location access' }
    }

    // 10. Log in audit table
    await supabase
      .from('user_audit_logs')
      .insert({
        modified_user_id: newUserId,
        modified_by_user_id: user.id,
        action: 'created',
        changes: {
          email: normalizedEmail,
          full_name: fullName || null,
          role_permission_id: rolePermissionId,
          location_ids: locationIds
        }
      })

    return { success: true, userId: newUserId }

  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all users in the current user's account
 */
export async function getAccountUsers() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get current user's account
  const { data: userLocations } = await supabase
    .from('user_location_access')
    .select('account_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!userLocations) {
    return []
  }

  const accountId = userLocations.account_id

  // Get all users with access to this account's locations
  const { data: accountUsers, error } = await supabase
    .from('user_location_access')
    .select(`
      user_id,
      locations!inner (
        location_id,
        name
      )
    `)
    .eq('account_id', accountId)

  if (error) {
    throw new Error('Failed to fetch users')
  }

  // Group by user_id to get unique users with their locations
  const userMap = new Map<string, any>()

  for (const entry of accountUsers) {
    if (!userMap.has(entry.user_id)) {
      userMap.set(entry.user_id, {
        userId: entry.user_id,
        locations: []
      })
    }
    userMap.get(entry.user_id).locations.push({
      locationId: entry.locations.location_id,
      locationName: entry.locations.name
    })
  }

  const userIds = Array.from(userMap.keys())

  // Get user details from auth.users
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()

  // Get role information
  const { data: userRoles } = await supabase
    .from('user_roles_permissions')
    .select(`
      user_id,
      role_permission_id,
      roles_permissions!inner (
        name,
        role_id,
        roles!inner (
          name
        )
      )
    `)
    .in('user_id', userIds)

  // Combine all data
  const enrichedUsers = userIds.map(userId => {
    const authUser = authUsers.find(u => u.id === userId)
    const userRole = userRoles?.find(ur => ur.user_id === userId)
    const userData = userMap.get(userId)

    return {
      userId,
      email: authUser?.email || 'Unknown',
      displayName: authUser?.raw_user_meta_data?.display_name || null,
      createdAt: authUser?.created_at,
      roleName: userRole?.roles_permissions?.roles?.name || 'No role',
      rolePermissionName: userRole?.roles_permissions?.name || 'No permission set',
      rolePermissionId: userRole?.role_permission_id,
      locations: userData.locations
    }
  })

  return enrichedUsers.sort((a, b) => a.email.localeCompare(b.email))
}

/**
 * Update a user's information
 */
export async function updateUser(
  targetUserId: string,
  updates: {
    fullName?: string
    rolePermissionId?: number
    locationIds?: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Check if user can manage users
    const { canCreate } = await canUserCreateUsers()
    if (!canCreate) {
      return { success: false, error: 'You do not have permission to update users' }
    }

    // Cannot update yourself (use profile page instead)
    if (targetUserId === user.id) {
      return { success: false, error: 'Use your profile page to update your own information' }
    }

    // Get target user's current role
    const { data: targetRole } = await supabase
      .from('user_roles_permissions')
      .select(`
        roles_permissions!inner (
          permission_ids
        )
      `)
      .eq('user_id', targetUserId)
      .single()

    if (!targetRole) {
      return { success: false, error: 'Target user not found' }
    }

    // Get current user's permissions
    const { data: creatorRole } = await supabase
      .from('user_roles_permissions')
      .select(`
        roles_permissions!inner (
          permission_ids
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!creatorRole) {
      return { success: false, error: 'Your role not found' }
    }

    // Validate: Can only update users with equal or lesser permissions
    const canUpdate = targetRole.roles_permissions.permission_ids.every(p =>
      creatorRole.roles_permissions.permission_ids.includes(p)
    )

    if (!canUpdate) {
      return { success: false, error: 'You cannot update users with higher permissions than yours' }
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const changes: Record<string, any> = {}

    // Update display name if provided
    if (updates.fullName !== undefined) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        {
          user_metadata: {
            display_name: updates.fullName || null
          }
        }
      )

      if (updateError) {
        console.error('Failed to update display name:', updateError)
        return { success: false, error: 'Failed to update user name' }
      }

      changes.display_name = updates.fullName || null
    }

    // Update role if provided
    if (updates.rolePermissionId !== undefined) {
      // Get new role's permissions
      const { data: newRole } = await supabase
        .from('roles_permissions')
        .select('permission_ids')
        .eq('role_permission_id', updates.rolePermissionId)
        .single()

      if (!newRole) {
        return { success: false, error: 'Target role not found' }
      }

      // Validate creator can assign this role
      const canAssignRole = newRole.permission_ids.every(p =>
        creatorRole.roles_permissions.permission_ids.includes(p)
      )

      if (!canAssignRole) {
        return {
          success: false,
          error: 'You do not have sufficient permissions to assign this role'
        }
      }

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles_permissions')
        .update({ role_permission_id: updates.rolePermissionId })
        .eq('user_id', targetUserId)

      if (roleError) {
        console.error('Failed to update role:', roleError)
        return { success: false, error: 'Failed to update user role' }
      }

      changes.role_permission_id = updates.rolePermissionId
    }

    // Update locations if provided
    if (updates.locationIds !== undefined) {
      // Get creator's locations
      const { data: creatorLocations } = await supabase
        .from('user_location_access')
        .select('location_id, account_id')
        .eq('user_id', user.id)

      const creatorLocationIds = creatorLocations?.map(l => l.location_id) || []
      const accountId = creatorLocations?.[0]?.account_id

      if (!accountId) {
        return { success: false, error: 'Creator account not found' }
      }

      // Ensure creator has access to all specified locations
      const invalidLocations = updates.locationIds.filter(locId => !creatorLocationIds.includes(locId))
      if (invalidLocations.length > 0) {
        return {
          success: false,
          error: 'You do not have access to some of the specified locations'
        }
      }

      // Delete existing location assignments
      await supabase
        .from('user_location_access')
        .delete()
        .eq('user_id', targetUserId)

      // Insert new location assignments
      const locationAccessRows = updates.locationIds.map(locationId => ({
        user_id: targetUserId,
        location_id: locationId,
        account_id: accountId,
        created_by: user.id
      }))

      const { error: locationError } = await supabase
        .from('user_location_access')
        .insert(locationAccessRows)

      if (locationError) {
        console.error('Failed to update locations:', locationError)
        return { success: false, error: 'Failed to update location access' }
      }

      changes.location_ids = updates.locationIds
    }

    // Log update in audit table
    if (Object.keys(changes).length > 0) {
      await supabase
        .from('user_audit_logs')
        .insert({
          modified_user_id: targetUserId,
          modified_by_user_id: user.id,
          action: 'updated',
          changes
        })
    }

    return { success: true }

  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a user (only if creator has permission)
 */
export async function deleteUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Check if user can create users (same permission level for deletion)
    const { canCreate } = await canUserCreateUsers()
    if (!canCreate) {
      return { success: false, error: 'You do not have permission to delete users' }
    }

    // Cannot delete yourself
    if (targetUserId === user.id) {
      return { success: false, error: 'You cannot delete your own account' }
    }

    // Get target user's role
    const { data: targetRole } = await supabase
      .from('user_roles_permissions')
      .select(`
        roles_permissions!inner (
          permission_ids
        )
      `)
      .eq('user_id', targetUserId)
      .single()

    if (!targetRole) {
      return { success: false, error: 'Target user not found' }
    }

    // Get current user's permissions
    const { data: creatorRole } = await supabase
      .from('user_roles_permissions')
      .select(`
        roles_permissions!inner (
          permission_ids
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!creatorRole) {
      return { success: false, error: 'Your role not found' }
    }

    // Validate: Can only delete users with equal or lesser permissions
    const canDelete = targetRole.roles_permissions.permission_ids.every(p =>
      creatorRole.roles_permissions.permission_ids.includes(p)
    )

    if (!canDelete) {
      return { success: false, error: 'You cannot delete users with higher permissions than yours' }
    }

    // Delete user from auth.users (cascade will handle other tables)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return { success: false, error: 'Failed to delete user' }
    }

    // Log deletion
    await supabase
      .from('user_audit_logs')
      .insert({
        modified_user_id: targetUserId,
        modified_by_user_id: user.id,
        action: 'deleted',
        changes: {
          deleted_at: new Date().toISOString()
        }
      })

    return { success: true }

  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
