# Quick Start — Certus Dashboard Development

**Last Updated:** 2025-11-15
**Current Phase:** Phase 1 Complete (Overview Page)

---

## 🎯 What's Done

### ✅ Overview Page (100% Complete)
- Full layout with sidebar, header, and content
- 6 KPI tiles with trends
- Revenue emphasis (30% larger, highlighted)
- Time filter tabs
- Quick Actions sidebar
- Recent Activities table
- Mock data infrastructure

**Live Components:**
- `/components/layout/sidebar.tsx`
- `/components/layout/dashboard-header.tsx`
- `/components/dashboard/kpi-tile.tsx`
- `/components/dashboard/quick-action-card.tsx`
- `/components/dashboard/recent-activities-table.tsx`

**Page:** `/app/(dashboard)/overview/page.tsx`

---

## 📋 What's Next

### Priority Order:
1. **Call Logs Page** (highest value)
2. **Analytics Page** (insights)
3. **Configuration Page** (settings)

---

## 🎨 Design System Reference

### Quick Copy-Paste Patterns

#### Card Wrapper
```tsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  {/* Content */}
</div>
```

#### Section Header
```tsx
<h2 className="text-lg font-semibold text-gray-900 mb-4">
  Section Title
</h2>
```

#### Filter Tabs
```tsx
<div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
  <button className={active ? "bg-white text-gray-900 shadow-sm px-4 py-2 rounded-md" : "text-gray-600 px-4 py-2"}>
    Filter
  </button>
</div>
```

#### Grid Layout (Not Table)
```tsx
<div className="grid grid-cols-[...specific-columns...] gap-4 px-6 py-4">
  {/* Columns */}
</div>
```

### Colors

**Use Sparingly:**
- `bg-gradient-to-br from-red-500 to-pink-600` — Revenue, active nav, primary actions
- `text-emerald-600` — Success, positive trends (↑)
- `text-red-600` — Errors, negative trends (↓)
- `text-amber-600` — Warnings, attention needed

**Use Freely:**
- `bg-gray-50` — Page backgrounds
- `bg-white` — Cards, modals
- `border-gray-100` — Card borders
- `text-gray-900` — Primary text
- `text-gray-600` — Secondary text
- `text-gray-500` — Tertiary text

### Typography
- Heading: `text-lg font-semibold text-gray-900`
- Body: `text-sm font-normal text-gray-600`
- Label: `text-xs font-medium text-gray-500`

---

## 📊 Mock Data Pattern

**Location:** `/lib/mock-data.ts`

**Pattern:**
```tsx
// 1. Define interface
export interface DataType {
  id: string;
  // ... fields
}

// 2. Export data
export const mockData: DataType[] = [
  {
    id: 'unique-id',
    // ... values
  },
];
```

**Existing Mocks:**
- `mockKPIData` — 6 KPIs with trends
- `mockQuickActions` — 3 quick actions
- `mockRecentActivities` — 6 recent calls
- `timeFilterOptions` — Filter options

---

## 🔧 Component Reuse Guide

### From Overview Page → Use In:

**KPITile**
- ✅ Overview (done)
- → Analytics (for summary metrics at top)
- → Call Logs (optional summary bar)

**Recent Activities Table Pattern**
- ✅ Overview (done)
- → Call Logs (main table, add filters)

**Filter Tabs**
- ✅ Overview (done)
- → Analytics (date range)
- → Call Logs (call type, status filters)

**Quick Action Card**
- ✅ Overview (done)
- → Configuration (action buttons for settings)

---

## 🏗️ Building Call Logs Page

### Required Components (in order):

1. **Call Logs Table**
   - Copy pattern from `recent-activities-table.tsx`
   - Add filter inputs above table
   - Add pagination controls below

2. **Filter Bar**
   - Date range picker
   - Call type dropdown
   - Status dropdown
   - Search input

3. **Call Drawer** (right sidebar)
   - Tabs: Transcript, Summary, Order Details, Notes
   - Customer profile section
   - Audio player (if recording available)

### Suggested Approach:
```tsx
// 1. Start with table only
<CallLogsTable data={mockCalls} />

// 2. Add filters
<FilterBar onFilterChange={handleFilter} />
<CallLogsTable data={filteredCalls} />

// 3. Add drawer
<CallLogsTable data={filteredCalls} onRowClick={setSelectedCall} />
{selectedCall && <CallDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />}
```

---

## 📈 Building Analytics Page

### Required Components:

1. **Summary KPI Bar**
   - Reuse `<KPITile>` component (3-4 tiles)

2. **Chart Components**
   - Install: `npm install recharts`
   - Line chart for time series
   - Bar chart for distribution

3. **Date Range Selector**
   - Reuse filter tabs pattern

4. **Export Button**
   - Server action to generate CSV

### Suggested Approach:
```tsx
// 1. Summary metrics at top
<div className="grid grid-cols-4 gap-4">
  {summaryMetrics.map(metric => <KPITile {...metric} />)}
</div>

// 2. Charts below
<div className="grid grid-cols-2 gap-6">
  <LineChart data={timeSeriesData} />
  <BarChart data={distributionData} />
</div>
```

---

## ⚙️ Building Configuration Page

### Required Components:

1. **Settings Sections**
   - Business Hours editor
   - AI Voice selector
   - Busy Mode toggle
   - Knowledge Update button

2. **Form Pattern**
```tsx
<div className="flex flex-col gap-6">
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Section Title
    </h3>
    {/* Form fields */}
  </div>
</div>
```

---

## 🎯 Restaurant Owner Design Checklist

When building a new page, ask:
- ✅ Is revenue/money info prominent?
- ✅ Is "Today" the default time range?
- ✅ Can I scan and understand in 3 seconds?
- ✅ Is every element actionable or informative?
- ✅ Are trends/changes clearly indicated?
- ✅ Is color used purposefully (not decoration)?

---

## 📚 Full Documentation

**Design & UI:**
- `docs/ui/IMPLEMENTATION_STATUS.md` — Detailed implementation guide
- `docs/ui/components_map.md` — Component specs and mapping
- `docs/ui/tokens.json` — Design tokens from Figma
- `docs/ui/interaction_specs.md` — Animations and micro-interactions

**Product & Architecture:**
- `docs/prd.md` — Product requirements (now includes design system)
- `docs/architecture.md` — Technical architecture
- `docs/ux/page_map.md` — Page structure and flows

**Code:**
- `/components/` — All UI components
- `/app/(dashboard)/` — Page routes
- `/lib/mock-data.ts` — Mock data

---

## 🚀 Getting Started on Next Page

1. Read `docs/ui/IMPLEMENTATION_STATUS.md`
2. Copy patterns from Overview page
3. Create mock data for new page
4. Build components incrementally
5. Test as you go
6. Keep it simple and scannable

**Questions?** Check the docs above or review the Overview page implementation.
