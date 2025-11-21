# Component Patterns & Design Guide

**Version:** 1.0
**Last Updated:** 2025-11-20
**Purpose:** Reusable patterns, components, and design decisions for the dashboard

---

## Design Principles

### 1. Restaurant Owner First
- Revenue and money metrics always prominent
- "Today" is the default time range
- Data is scannable at a glance
- Quick actions are practical, not clever

### 2. Clean & Modern
- White card backgrounds on gray-50 page backgrounds
- Subtle shadows with hover enhancement
- Rounded corners (`rounded-xl` = 12px)
- Ample whitespace for breathing room

### 3. Purposeful Color
Red/Pink gradients ONLY for:
- Revenue emphasis (KPI tiles)
- Active navigation states
- Primary action buttons

Other colors:
- **Green** — Success, positive metrics, up trends
- **Amber** — Warnings, attention needed
- **Gray** — Neutral, secondary elements

### 4. Smooth Interactions
- Hover states on all clickable elements
- 150-200ms transitions
- Subtle scale on buttons (1.01-1.02)
- Shadow enhancement on hover

---

## Typography

**Font:** Inter Tight (variable font)
**Weights:** 300, 400, 500, 600, 700

```typescript
// layout.tsx
import { Inter_Tight } from 'next/font/google'

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter-tight',
})
```

**Usage patterns:**
- Page titles: `text-2xl font-bold`
- Section headers: `text-lg font-semibold`
- KPI labels: `text-sm font-medium text-gray-600`
- KPI values: `text-3xl font-bold`
- Body text: `text-sm text-gray-700`

---

## Layout Components

### Sidebar ([components/layout/sidebar.tsx](../../components/layout/sidebar.tsx))

**Features:**
- White background with Certus logo
- Navigation items: Home, Analytics, Call Logs, Settings
- Active state with gradient background + left indicator bar
- Fully responsive (collapses on mobile)

**Active state pattern:**
```tsx
{isActive && (
  <>
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-pink-600" />
    <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent" />
  </>
)}
```

### Dashboard Header ([components/layout/dashboard-header.tsx](../../components/layout/dashboard-header.tsx))

**Features:**
- Greeting and subtitle
- Optional banner (e.g., "Earn £200" referral)
- User avatar with initials
- Clean, minimal design

---

## Reusable Components

### KPI Tile ([components/dashboard/kpi-tile.tsx](../../components/dashboard/kpi-tile.tsx))

**Use for:** Any metric display (calls, revenue, orders, etc.)

**Features:**
- Icon + Label + Value
- Optional trend indicators (↑/↓ with percentage)
- Revenue tile gets automatic highlighting
- Gradient backgrounds for emphasis
- Hover effects

**Example:**
```tsx
<KPITile
  icon={<DollarSign className="w-5 h-5" />}
  label="Total Revenue"
  value="$2,345.67"
  trend={{ value: 18, direction: 'up' }}
/>
```

**Revenue highlighting:**
```tsx
// Revenue tile is 30% larger and gets gradient background
className={isRevenue
  ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
  : 'bg-white border-gray-100'
}
```

### Quick Action Card ([components/dashboard/quick-action-card.tsx](../../components/dashboard/quick-action-card.tsx))

**Use for:** Action buttons in sidebar

**Features:**
- Icon with gradient badge
- Title + Description
- Optional status badge
- Hover animations

**Example:**
```tsx
<QuickActionCard
  icon={<Upload className="w-5 h-5" />}
  title="Update Menu"
  description="Upload latest menu items"
  statusBadge="Action Required"
/>
```

### Recent Activities Table ([components/dashboard/recent-activities-table.tsx](../../components/dashboard/recent-activities-table.tsx))

**Use for:** Call logs, recent activities, any tabular data

**Features:**
- Grid-based layout (not traditional `<table>`)
- Health indicators (success/warning/error)
- Type icons and labels
- Clickable rows
- Modern styling with hover states

**Pattern:**
```tsx
<div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-gray-50">
  <HealthIndicator status={activity.health} />
  <div>{activity.summary}</div>
  <div className="text-gray-500">{activity.time}</div>
</div>
```

### Call Detail Sheet ([components/dashboard/call-detail-sheet.tsx](../../components/dashboard/call-detail-sheet.tsx))

**Use for:** Detailed call view in drawer

**Features:**
- Sticky header with phone number, health indicator
- Conditional top banners (Order/Reservation/Complaint)
- Audio recording playback
- Conversation transcript with speaker avatars
- Order details with reliable `total_amount` usage
- Reservation details
- Call summary section
- Skeleton loader for async states

**Important pattern — Order total:**
```tsx
// ✅ ALWAYS use total_amount directly from order_logs
const displayTotal = order.total_amount || 0
const formattedTotal = `$${(displayTotal / 100).toFixed(2)}`

// ❌ NEVER calculate from components
const calculatedTotal = (order.subtotal || 0) + (order.total_tax || 0) // WRONG!
```

---

## Common Patterns

### Card Pattern
```tsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```

### Section Header Pattern
```tsx
<h2 className="text-lg font-semibold text-gray-900 mb-4">
  Section Title
</h2>
```

### Filter Tabs Pattern
```tsx
<div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
  <button
    className={cn(
      "px-4 py-2 rounded-md text-sm font-medium transition-all",
      isActive
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    )}
  >
    Filter Option
  </button>
</div>
```

### Grid/Table Pattern (NOT traditional `<table>`)
```tsx
<div className="space-y-2">
  {items.map(item => (
    <div
      key={item.id}
      className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div>{item.icon}</div>
      <div>{item.content}</div>
      <div>{item.action}</div>
    </div>
  ))}
</div>
```

### Gradient Accent Pattern (use sparingly!)
```tsx
// Only for emphasis or active states
className="bg-gradient-to-br from-red-500 to-pink-600"
```

---

## Data Patterns

### Call Type Detection (NEVER use boolean flags!)

```typescript
// ✅ CORRECT: Check actual rows in related tables
const callIds = calls?.map(c => c.id) || []
const [allOrders, allReservations] = await Promise.all([
  supabase.from('order_logs').select('call_id').in('call_id', callIds),
  supabase.from('reservations').select('call_id').in('call_id', callIds)
])

// Create lookup sets for O(1) access
const orderCallIds = new Set(allOrders.data?.map(o => o.call_id) || [])
const reservationCallIds = new Set(allReservations.data?.map(r => r.call_id) || [])

// Determine type
const displayType = orderCallIds.has(call.id)
  ? 'order'
  : reservationCallIds.has(call.id)
  ? 'reservation'
  : call.pathway_tags_formatted?.includes('catering')
  ? 'catering'
  : 'inquiry'
```

**Why:** Boolean flags in `call_logs` (like `order_made`, `reservation_made`) are unreliable. Always query the actual tables.

### Order Total Calculation (Always Reliable!)

```typescript
// ✅ CORRECT: Use total_amount directly
const displayTotal = order.total_amount || 0
const formattedTotal = `$${(displayTotal / 100).toFixed(2)}`

// ❌ WRONG: Never calculate from components
const calculatedTotal = (order.subtotal || 0) + (order.total_tax || 0) + ...
```

**Why:** `total_amount` in `order_logs` is the source of truth. Calculating from subtotal/tax/etc. is unreliable.

### Location Access Pattern (Two-Tier)

```typescript
// 1. Check if franchise owner (role_permission_id = 5)
const { data: accountData } = await supabase
  .from('accounts')
  .select('account_id, email')
  .eq('email', user.email)
  .maybeSingle()

if (accountData) {
  // Fetch ALL locations for this account
  const { data: allLocations } = await supabase
    .from('locations')
    .select('*')
    .eq('account_id', accountData.account_id)

  // User can switch locations via dropdown
  locations = allLocations
  selectedLocation = searchParams.locationId
    ? locations.find(l => l.location_id === searchParams.locationId)
    : locations[0]
} else {
  // 2. Single location manager - look up by email
  const { data: locationResults } = await supabase
    .from('locations')
    .select('*')
    .eq('certus_notification_email', user.email)
    .limit(1)

  // User gets ONE fixed location, no selector
  selectedLocation = locationResults[0]
  locations = [selectedLocation]
}
```

**Implemented in:**
- [app/(dashboard)/overview/page.tsx](../../app/(dashboard)/overview/page.tsx)
- [app/(dashboard)/call-logs/page.tsx](../../app/(dashboard)/call-logs/page.tsx)

---

## Skeleton Loaders

### Pattern

All skeletons use shimmer animation:

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

### Available Skeletons ([components/dashboard/skeletons.tsx](../../components/dashboard/skeletons.tsx))

- `CallDetailSheetSkeleton` — For call drawer loading
- `StatsCardSkeleton` — For stats cards
- `RecentActivitiesTableSkeleton` — For table loading
- `KPICardSkeleton` — For KPI tiles

**Usage:**
```tsx
// In loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
      <RecentActivitiesTableSkeleton />
    </div>
  )
}
```

---

## Database Reliability Rules

### ✅ Fully Reliable Tables
- `order_logs` — All fields including `total_amount`, `subtotal`, `total_tax`, etc.
- `reservations` — All fields
- `complaints` — All fields
- `upsells` — All fields

### ❌ Unreliable Fields (Never Trust!)
- `call_logs.order_made` — Often false even when orders exist
- `call_logs.reservation_made` — Often false even when reservations exist
- `call_logs.order_completed` — Unreliable status

**Best Practice:** Always query related tables directly, never trust boolean flags in `call_logs`.

---

## Server Component Patterns

### Data Fetching

```tsx
// Server component with async data fetching
export default async function Page() {
  const data = await fetchData() // Direct Supabase query
  return <ClientComponent data={data} />
}
```

### Client Interactivity

```tsx
'use client'

export function InteractiveComponent({ data }) {
  const [state, setState] = useState()
  // Only use 'use client' when needed for interactivity
}
```

### Caching

```tsx
// Cache page data for 60 seconds
export const revalidate = 60

export default async function Page() {
  const metrics = await getMetrics() // Cached
  return <Dashboard data={metrics} />
}
```

---

## When Building New Pages

### Reuse These Components
1. **KPITile** — For any metric display
2. **QuickActionCard** — For action buttons
3. **Sidebar** — Already global via layout
4. **DashboardHeader** — Already global via layout

### Follow These Patterns
1. **Card Pattern** — White cards on gray-50 background
2. **Filter Tabs** — For time/category filters
3. **Grid Layout** — NOT traditional tables
4. **Skeleton Loaders** — For async states

### Avoid Over-Engineering
- Don't add features beyond what's requested
- Don't add comments/docs to code you didn't change
- Don't add error handling for scenarios that can't happen
- Don't create abstractions for one-time operations

### Test as You Go
- Click through every interaction
- Check hover states
- Verify responsive behavior
- Make sure it "feels" good

---

## Quick Reference

### Colors
- Primary gradient: `from-red-500 to-pink-600`
- Success: `text-emerald-600`, `bg-emerald-50`
- Warning: `text-amber-600`, `bg-amber-50`
- Error: `text-red-600`, `bg-red-50`
- Neutral: `text-gray-600`, `bg-gray-50`

### Spacing
- Card padding: `p-6`
- Section gaps: `space-y-6`
- Grid gaps: `gap-6`
- Component gaps: `gap-4`

### Borders & Shadows
- Card border: `border border-gray-100`
- Card shadow: `shadow-sm hover:shadow-md`
- Rounded corners: `rounded-xl` (12px)

### Transitions
- Standard: `transition-all duration-200`
- Colors only: `transition-colors duration-150`
- Shadows: `transition-shadow duration-200`

---

## Related Documentation

- **[Authentication Flow](../auth/authentication.md)** — How auth and location access works
- **[Metrics Quick Start](../METRICS_QUICK_START.md)** — User journey and data flow
- **[Database Schema](../database_schema.md)** — Full table reference
- **[Components Map](./components_map.md)** — Figma to component mapping
