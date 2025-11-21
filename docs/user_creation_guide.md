# User Creation Guide

**Last Updated:** 2025-11-20
**Purpose:** Step-by-step guide for creating new users in the Certus Operations Dashboard

---

## Overview

Creating a new user involves multiple steps across different tables. This guide explains what happens when a user is created, the required database insertions, and the validation logic that protects the system.

**Key Principle:** Users can only create other users with equal or lesser permissions than their own.

---

## Prerequisites

Before creating a user, the creator must:

1. **Have permission to create users** (determined by `account_settings.user_creation_permission_level`)
2. **Have all the permissions** they want to assign to the new user (permission array subset check)
3. **Have access to the locations** they want to assign to the new user

---

## Step-by-Step Process

### Step 1: Validate Creator Permissions

Before any user creation begins, the system validates:

**1.1 Check if creator can create users**
```sql
-- Get creator's role_id
SELECT rp.role_id
FROM user_roles_permissions urp
JOIN roles_permissions rp ON urp.role_permission_id = rp.role_permission_id
WHERE urp.user_id = 'creator-user-uuid';

-- Get account's user creation permission level
SELECT user_creation_permission_level
FROM account_settings
WHERE account_id = 'account-uuid';

-- Creator's role_id must be >= user_creation_permission_level
```

**1.2 Validate permission array subset**
```typescript
// Get creator's permissions
const creatorPermissions = [1, 2, 3, 4, 5]; // Example

// Get target role's permissions
const targetPermissions = [1, 2, 3]; // Example

// Validation check
const canAssignRole = targetPermissions.every(p =>
  creatorPermissions.includes(p)
);

// Result: true (all target permissions exist in creator's array)
```

**1.3 Validate location access**
```sql
-- Get creator's accessible locations
SELECT location_id
FROM user_location_access
WHERE user_id = 'creator-user-uuid';

-- All target location_ids must be in creator's accessible locations
```

---

### Step 2: Create User in auth.users

**Method:** Supabase Admin API

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const { data: newUserData, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'newuser@example.com',
  email_confirm: true, // Auto-confirm email
  user_metadata: {
    created_by: 'creator-user-uuid',
    created_at: new Date().toISOString()
  }
});

const newUserId = newUserData.user.id;
```

**Result:** New user created in `auth.users` table with:
- `id`: UUID (auto-generated)
- `email`: Provided email address
- `email_confirmed_at`: Current timestamp (auto-confirmed)
- `user_metadata`: Creator info

---

### Step 3: Assign Permission Set

**Table:** `user_roles_permissions`

```sql
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES (
  'new-user-uuid',
  3 -- role_permission_id selected by creator
);
```

**Important:** This determines what the user can do in the system.

**Rollback if this fails:**
```typescript
// Delete the auth user if role assignment fails
await supabaseAdmin.auth.admin.deleteUser(newUserId);
```

---

### Step 4: Assign Location Access

**Table:** `user_location_access`

Users can be assigned to **one or multiple locations**.

**Single Location:**
```sql
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES (
  'new-user-uuid',
  'location-uuid',
  'account-uuid',
  'creator-user-uuid'
);
```

**Multiple Locations:**
```sql
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES
  ('new-user-uuid', 'location-uuid-1', 'account-uuid', 'creator-user-uuid'),
  ('new-user-uuid', 'location-uuid-2', 'account-uuid', 'creator-user-uuid'),
  ('new-user-uuid', 'location-uuid-3', 'account-uuid', 'creator-user-uuid');
```

**Rollback if this fails:**
```typescript
// Delete auth user and role assignment
await supabaseAdmin.auth.admin.deleteUser(newUserId);
await supabase.from('user_roles_permissions').delete().eq('user_id', newUserId);
```

---

### Step 5: Log Creation in Audit Table

**Table:** `user_audit_logs`

```sql
INSERT INTO user_audit_logs (modified_user_id, modified_by_user_id, action, changes)
VALUES (
  'new-user-uuid',
  'creator-user-uuid',
  'created',
  '{
    "email": "newuser@example.com",
    "role_permission_id": 3,
    "location_ids": ["uuid1", "uuid2", "uuid3"]
  }'::jsonb
);
```

**Purpose:** Creates audit trail for compliance and debugging.

---

## Complete Example: Creating a Manager

### Scenario
- **Creator:** Owner with permissions `[1, 2, 3, 4, 5]`
- **Target User:** Manager with permission set `[1, 2, 3]`
- **Locations:** 2 locations (Main St, Oak Ave)

### Database Insertions

**1. auth.users (via Supabase Admin API)**
```typescript
const { data } = await supabaseAdmin.auth.admin.createUser({
  email: 'manager@restaurant.com',
  email_confirm: true,
  user_metadata: {
    created_by: 'owner-uuid',
    created_at: '2025-11-20T10:30:00Z'
  }
});
// Result: id = 'manager-uuid'
```

**2. user_roles_permissions**
```sql
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES ('manager-uuid', 5);
-- 5 is the role_permission_id for "Manager Default"
```

**3. user_location_access**
```sql
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES
  ('manager-uuid', 'main-st-uuid', 'account-uuid', 'owner-uuid'),
  ('manager-uuid', 'oak-ave-uuid', 'account-uuid', 'owner-uuid');
```

**4. user_audit_logs**
```sql
INSERT INTO user_audit_logs (modified_user_id, modified_by_user_id, action, changes)
VALUES (
  'manager-uuid',
  'owner-uuid',
  'created',
  '{
    "email": "manager@restaurant.com",
    "role_permission_id": 5,
    "location_ids": ["main-st-uuid", "oak-ave-uuid"]
  }'::jsonb
);
```

---

## User Types Examples

### Example 1: Single-Location Manager
**Use Case:** Store manager for one location

```sql
-- Step 1: Create in auth.users (via API)
-- Step 2: Assign manager role
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES ('user-uuid', 5); -- Manager Default

-- Step 3: Assign ONE location
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES ('user-uuid', 'downtown-location-uuid', 'account-uuid', 'creator-uuid');
```

---

### Example 2: Multi-Location Regional Manager
**Use Case:** Regional manager overseeing 3 locations

```sql
-- Step 1: Create in auth.users (via API)
-- Step 2: Assign regional manager role
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES ('user-uuid', 7); -- Regional Manager Default

-- Step 3: Assign MULTIPLE locations
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES
  ('user-uuid', 'north-region-1-uuid', 'account-uuid', 'creator-uuid'),
  ('user-uuid', 'north-region-2-uuid', 'account-uuid', 'creator-uuid'),
  ('user-uuid', 'north-region-3-uuid', 'account-uuid', 'creator-uuid');
```

---

### Example 3: Franchise Owner
**Use Case:** Owner with access to ALL locations in their account

```sql
-- Step 1: Create in auth.users (via API)
-- Step 2: Assign owner role
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES ('user-uuid', 9); -- Owner Default

-- Step 3: Assign ALL account locations
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
SELECT 'user-uuid', location_id, account_id, 'creator-uuid'
FROM locations
WHERE account_id = 'account-uuid';
```

---

## Permission Validation Examples

### Example 1: Owner Creating Manager (✅ Allowed)
```typescript
// Owner has permissions: [1, 2, 3, 4, 5]
// Manager Default has permissions: [1, 2, 3]

const canCreate = [1, 2, 3].every(p => [1, 2, 3, 4, 5].includes(p));
// Result: true (all manager permissions exist in owner's array)
```

---

### Example 2: Manager Creating Owner (❌ Denied)
```typescript
// Manager has permissions: [1, 2, 3]
// Owner Default has permissions: [1, 2, 3, 4, 5]

const canCreate = [1, 2, 3, 4, 5].every(p => [1, 2, 3].includes(p));
// Result: false (4 and 5 are not in manager's array)
```

---

### Example 3: Manager Creating Staff (✅ Allowed)
```typescript
// Manager has permissions: [1, 2, 3]
// Staff Default has permissions: [1]

const canCreate = [1].every(p => [1, 2, 3].includes(p));
// Result: true (staff's permission 1 exists in manager's array)
```

---

## Error Handling & Rollback

If any step fails after the user is created in `auth.users`, the system must rollback:

```typescript
try {
  // Step 1: Create user in auth
  const { data: newUser } = await supabaseAdmin.auth.admin.createUser({...});
  const newUserId = newUser.user.id;

  // Step 2: Assign role
  const { error: roleError } = await supabase
    .from('user_roles_permissions')
    .insert({...});

  if (roleError) {
    // ROLLBACK: Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    throw new Error('Failed to assign role');
  }

  // Step 3: Assign locations
  const { error: locationError } = await supabase
    .from('user_location_access')
    .insert([...]);

  if (locationError) {
    // ROLLBACK: Delete auth user and role
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    await supabase.from('user_roles_permissions').delete().eq('user_id', newUserId);
    throw new Error('Failed to assign locations');
  }

  // Step 4: Log creation (non-critical, no rollback needed)
  await supabase.from('user_audit_logs').insert({...});

} catch (error) {
  return { success: false, error: error.message };
}
```

---

## UI Implementation

The user creation UI is located at:
- **Page:** `app/(dashboard)/settings/users/page.tsx`
- **Client Component:** `app/(dashboard)/settings/users/users-client.tsx`
- **Dialog Form:** `app/(dashboard)/settings/users/create-user-dialog.tsx`
- **Server Actions:** `app/(dashboard)/settings/users/actions.ts`

### User Creation Flow

1. User clicks "Create User" button
2. Dialog opens with form:
   - Email input (required)
   - Role dropdown (auto-filtered to creatable roles)
   - Location multi-select (auto-filtered to assignable locations)
3. User fills form and submits
4. Server action validates and creates user
5. Page refreshes to show new user
6. Success/error message displayed

---

## Account Settings Configuration

Account owners can configure who can create users:

**Table:** `account_settings`
**Column:** `user_creation_permission_level`

**Default Value:** `5` (Only owners can create users)

```sql
-- Allow managers and above to create users
UPDATE account_settings
SET user_creation_permission_level = 3
WHERE account_id = 'account-uuid';

-- Allow only owners to create users (most restrictive)
UPDATE account_settings
SET user_creation_permission_level = 5
WHERE account_id = 'account-uuid';
```

---

## Security Considerations

1. **Permission Subset Validation:** Prevents privilege escalation (users can't create users more powerful than themselves)
2. **Location Access Validation:** Ensures users can only assign access to locations they control
3. **Account Isolation:** All location assignments include `account_id` to prevent cross-account access
4. **Audit Logging:** All user creation actions are logged for compliance
5. **Rollback on Failure:** Partial creation is prevented by rollback logic
6. **Email Uniqueness:** System checks for existing users before creation

---

## Troubleshooting

### User Creation Fails with "Permission Denied"
**Cause:** Creator doesn't have required role_id based on `user_creation_permission_level`
**Solution:** Account owner must lower the `user_creation_permission_level` or upgrade creator's role

### User Creation Fails with "Insufficient Permissions"
**Cause:** Creator trying to assign permissions they don't have
**Solution:** Choose a role with permissions that are a subset of creator's permissions

### User Creation Fails with "Location Access Denied"
**Cause:** Creator trying to assign locations they don't have access to
**Solution:** Only select locations the creator has access to, or have an owner assign the locations

### User Created but Can't See Any Data
**Cause:** User has no location assignments
**Solution:** Assign at least one location in `user_location_access` table

---

## Related Documentation

- **[Roles & Permissions](./roles_and_permissions.md)** — Role definitions and permission structure
- **[Database Schema](./database_schema.md)** — Full database schema reference
- **[User Data Flow](./user_data_flow.md)** — How data is displayed to different users
- **[Authentication Flow](./auth/authentication.md)** — Login and session management
