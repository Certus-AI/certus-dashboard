'use client';

import React, { useState } from 'react';
import { KPITile } from '@/components/dashboard/kpi-tile';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { RecentActivitiesTable } from '@/components/dashboard/recent-activities-table';
import {
  mockKPIData,
  mockQuickActions,
  mockRecentActivities,
  timeFilterOptions,
  TimeFilter,
} from '@/lib/mock-data';

export default function OverviewPage() {
  const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilter>('today');

  return (
    <div className="flex flex-col gap-6 px-8 py-6 flex-1 w-full">
      {/* Time Filter Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {timeFilterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveTimeFilter(filter.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              filter.id === activeTimeFilter
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* KPI Section & Quick Actions */}
      <div className="flex items-start gap-6 w-full">
        {/* KPI Tiles Grid */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Top Row - Revenue (larger) + 2 KPIs */}
          <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-4">
            {mockKPIData.slice(0, 3).map((kpi) => (
              <KPITile key={kpi.id} {...kpi} />
            ))}
          </div>

          {/* Bottom Row - 3 KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {mockKPIData.slice(3, 6).map((kpi) => (
              <KPITile key={kpi.id} {...kpi} />
            ))}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="flex flex-col w-80 gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>

          <div className="flex flex-col gap-2">
            {mockQuickActions.map((action) => (
              <QuickActionCard key={action.id} {...action} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Table */}
      <RecentActivitiesTable
        activities={mockRecentActivities}
        onRowClick={(activity) => {
          console.log('Clicked activity:', activity);
          // TODO: Navigate to call logs with drawer open
        }}
      />
    </div>
  );
}
