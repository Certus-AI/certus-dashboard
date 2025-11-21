# Roles & Permissions Reference

**Last Updated:** 2025-11-20
**Purpose:** Define all roles in the system and their future permission mappings

---

## Overview

The Certus Operations Dashboard uses a flexible **Role-Based Access Control (RBAC)** system where:
- Roles define job functions (staff, manager, owner, etc.)
- Permissions define specific access rights (view calls, edit settings, etc.)
- One role can have multiple permission sets
- Users are assigned ONE permission set at a time

---

## Current Roles

### 1. Staff
**Role ID:** 1
**Description:** Regular crew member at one location

**Typical Users:**
- Front-of-house staff
- Kitchen staff
- Part-time employees

**Current Permissions:**
- TBD

**Future Access (Planned):**
- View today's call summary
- Listen to their own calls
- View basic metrics (calls handled, orders taken)
- No access to revenue or financial data
- No configuration access

---

### 2. Shift Lead
**Role ID:** 2
**Description:** Senior staff member who leads shifts and coordinates teams

**Typical Users:**
- Team leaders
- Shift supervisors
- Senior crew members

**Current Permissions:**
- TBD

**Future Access (Planned):**
- All staff permissions, plus:
- View full day's call logs
- Access team performance metrics
- View revenue (read-only)
- Add internal notes to calls
- No configuration access

---

### 3. Manager
**Role ID:** 3
**Description:** Store/location manager with operational control

**Typical Users:**
- Store managers
- General managers
- Operations managers

**Current Permissions:**
- TBD

**Future Access (Planned):**
- All shift lead permissions, plus:
- View all historical data (not just today)
- Access full analytics dashboard
- Export reports
- View and edit business hours
- Manage knowledge base updates
- View API usage
- No user management
- No billing access

---

### 4. Regional Manager
**Role ID:** 4
**Description:** Manages multiple locations within a region

**Typical Users:**
- District managers
- Regional directors
- Multi-unit supervisors

**Current Permissions:**
- TBD

**Future Access (Planned):**
- All manager permissions, plus:
- View data across multiple assigned locations
- Compare location performance
- Access regional analytics
- Manage settings for assigned locations
- No billing access
- No user creation (can request access for staff)

---

### 5. Owner
**Role ID:** 5
**Description:** Franchise/business owner with full system-wide access

**Typical Users:**
- Franchise owners
- Business owners
- C-level executives

**Current Permissions:**
- Full access to all features

**Future Access (Planned):**
- All regional manager permissions, plus:
- Access ALL locations under their account
- User management (create, edit, delete users)
- Assign roles and permissions
- Billing and subscription management
- API key management
- Advanced settings and configurations
- Account-level settings
- Audit log access

---

## Permission Sets

Each role can have multiple permission sets. For example:
- "Manager Default" (standard permissions)
- "Manager Advanced" (extended permissions for senior managers)
- "Manager Limited" (restricted access for trial period)

### Permission Set Structure

```sql
-- Example: Manager role with two permission sets
INSERT INTO roles_permissions (role_id, permission_ids, name, description)
VALUES
  (3, ARRAY[1, 2, 3], 'Manager Default', 'Standard manager permissions'),
  (3, ARRAY[1, 2, 3, 4], 'Manager Advanced', 'Extended permissions for senior managers');
```

---

## Permission Definitions

> **Note:** Specific permissions are not yet defined. This section will be updated as permissions are implemented.

**Placeholder Permission IDs:**
1. `permission_1` — Basic permission level 1
2. `permission_2` — Basic permission level 2
3. `permission_3` — Basic permission level 3
4. `permission_4` — Basic permission level 4
5. `permission_5` — Basic permission level 5

**Future Permission Categories (Planned):**

### Data Access Permissions
- View own calls only
- View location calls (all staff)
- View location calls (all time)
- View multi-location data
- View account-wide data
- Export data

### Financial Permissions
- View revenue data
- View detailed order amounts
- View cost data
- View profit margins
- Access billing information

### Configuration Permissions
- Edit business hours
- Update knowledge base
- Manage AI voice settings
- Configure busy mode
- Manage integrations

### User Management Permissions
- View user list
- Create users (controlled by account settings)
- Edit user roles
- Delete users
- View audit logs

**User Creation Control:**
The ability to create new users is controlled by the `user_creation_permission_level` field in the `account_settings` table. This field specifies the minimum role_id required to create users:

- `5` (Owner) - Only owners can create users (default)
- `4` (Regional Manager) - Regional managers and above
- `3` (Manager) - Managers and above
- `2` (Shift Lead) - Shift leads and above
- `1` (Staff) - Anyone can create users

**Permission Array Validation:**
When creating a new user, the creator can only assign permission sets where ALL target permissions are a subset of their own permissions:

```typescript
// Validation logic
const canAssignRole = targetPermissions.every(p =>
  creatorPermissions.includes(p)
)
```

**Examples:**
- Creator has permissions `[1, 2, 3, 4, 5]` → Can create users with `[1, 2, 3]`, `[1, 4]`, or `[5]`
- Creator has permissions `[1, 2, 3]` → Cannot create users with `[1, 2, 3, 4]` (4 is missing)
- Creator has permissions `[3, 4, 5]` → Cannot create users with `[1, 2]` (1 and 2 are missing)

### Analytics Permissions
- View basic metrics
- View advanced analytics
- View custom reports
- Create saved reports
- Schedule reports

---

## Location Access Rules

Location access is managed through the `user_location_access` junction table, which explicitly defines which locations each user can access.

### Single Location Access
**Applies to:** Staff, Shift Lead, Manager

Users with these roles are typically assigned to **one specific location**.

```sql
-- User's location(s) via junction table
SELECT l.location_id, l.name
FROM user_location_access ula
JOIN locations l ON ula.location_id = l.location_id
WHERE ula.user_id = 'user-uuid';
```

**UI Behavior:**
- No location selector shown (if only one location)
- Data is automatically filtered to their location(s)
- Cannot switch locations unless assigned to multiple

### Multi-Location Access
**Applies to:** Regional Manager, Owner

Users with these roles can access **multiple locations** under their account.

**Regional Manager:**
```sql
-- Regional manager with specific location assignments
SELECT l.*
FROM user_location_access ula
JOIN locations l ON ula.location_id = l.location_id
WHERE ula.user_id = 'regional-manager-uuid'
  AND ula.account_id = 'account-uuid';
```

**Owner:**
```sql
-- Owner gets ALL locations for their account
SELECT l.*
FROM user_location_access ula
JOIN locations l ON ula.location_id = l.location_id
WHERE ula.user_id = 'owner-uuid'
  AND ula.account_id = 'account-uuid';
```

**UI Behavior:**
- Location selector dropdown shown
- Can switch between locations
- Can view "All Locations" aggregate view
- URL param for location selection: `?locationId=123`

### Why user_location_access?

The `user_location_access` table replaces the old email-based pattern (`locations.certus_notification_email`) because:

1. **One user, multiple locations**: A user can now be assigned to multiple locations explicitly
2. **Explicit relationships**: No string matching required - direct foreign key relationships
3. **Better audit trail**: Tracks who assigned access and when
4. **Faster queries**: Indexed foreign keys instead of string comparisons
5. **Account isolation**: Ensures users only access locations within their account

---

## User Assignment

### How Users Get Roles

When a new user is created, the following steps occur:

1. **User is added to `auth.users`** (via Supabase Admin API)
2. **Permission set is assigned** in `user_roles_permissions` table
3. **Location access is granted** via `user_location_access` table (one or more rows)
4. **Audit log is created** in `user_audit_logs` table
5. **User can now log in** and access features based on their permission set and location access

```sql
-- Step 1: Create user in auth.users (via Supabase Admin API)
-- This happens in code using supabaseAdmin.auth.admin.createUser()

-- Step 2: Assign permission set
INSERT INTO user_roles_permissions (user_id, role_permission_id)
VALUES (
  'new-user-uuid',
  (SELECT role_permission_id FROM roles_permissions WHERE name = 'Manager Default')
);

-- Step 3: Assign location access (can be multiple rows)
INSERT INTO user_location_access (user_id, location_id, account_id, created_by)
VALUES
  ('new-user-uuid', 'location-uuid-1', 'account-uuid', 'creator-user-uuid'),
  ('new-user-uuid', 'location-uuid-2', 'account-uuid', 'creator-user-uuid');

-- Step 4: Log the creation
INSERT INTO user_audit_logs (modified_user_id, modified_by_user_id, action, changes)
VALUES (
  'new-user-uuid',
  'creator-user-uuid',
  'created',
  '{"email": "newuser@example.com", "role_permission_id": 3, "location_ids": ["uuid1", "uuid2"]}'::jsonb
);
```

See [User Creation Guide](./user_creation_guide.md) for detailed implementation steps.

### Changing User Roles

```sql
-- Update user's permission set
UPDATE user_roles_permissions
SET
  role_permission_id = (SELECT role_permission_id FROM roles_permissions WHERE name = 'Owner Default'),
  updated_at = NOW()
WHERE user_id = 'user-uuid';

-- Log the change in audit table
INSERT INTO user_audit_logs (modified_user_id, modified_by_user_id, action, changes)
VALUES (
  'user-uuid',
  'admin-user-uuid',
  'role_changed',
  '{"old_role": "Manager Default", "new_role": "Owner Default"}'::jsonb
);
```

---

## Role Hierarchy

```
Owner (5)
  └─ Full system access
  └─ All locations
  └─ User management
  └─ Billing

Regional Manager (4)
  └─ Multiple assigned locations
  └─ Regional analytics
  └─ Location settings

Manager (3)
  └─ Single location
  └─ Full operational access
  └─ Configuration

Shift Lead (2)
  └─ Single location
  └─ Team metrics
  └─ Read-only revenue

Staff (1)
  └─ Single location
  └─ Basic call access
  └─ No financial data
```

---

## Implementation Status

### ✅ Implemented
- Role definitions (5 roles)
- User-to-permission-set assignment
- Location access (two-tier pattern)
- Audit logging structure

### 🚧 In Progress
- Specific permission definitions
- Permission enforcement in UI
- Role-based route protection

### 📋 Planned
- Regional manager location assignments
- Custom permission sets
- Permission-based UI rendering
- API endpoint permissions
- Fine-grained data access control

---

## Database Schema Reference

### Tables

**roles:**
```sql
role_id SERIAL PRIMARY KEY
name TEXT UNIQUE (staff, shift_lead, manager, regional_manager, owner)
description TEXT
default_role_permission_id INTEGER
```

**permissions:**
```sql
permission_id SERIAL PRIMARY KEY
name TEXT UNIQUE (permission_1, permission_2, etc.)
description TEXT
```

**roles_permissions:**
```sql
role_permission_id SERIAL PRIMARY KEY
role_id INTEGER REFERENCES roles(role_id)
permission_ids INTEGER[] (array of permission IDs)
name TEXT (e.g., "Manager Default")
description TEXT
```

**user_roles_permissions:**
```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
role_permission_id INTEGER REFERENCES roles_permissions(role_permission_id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**user_audit_logs:**
```sql
audit_log_id SERIAL PRIMARY KEY
modified_user_id UUID (user whose permissions changed)
modified_by_user_id UUID (user who made the change)
action TEXT (created, updated, deleted, role_changed)
changes JSONB (before/after values)
created_at TIMESTAMPTZ
```

---

## Related Documentation

- **[Authentication Flow](./auth/authentication.md)** — How login and location access works
- **[User Data Flow](./user_data_flow.md)** — How data is displayed to different users
- **[Database Schema](./database_schema.md)** — Full schema reference
