'use client';

import React from 'react';
import Image from 'next/image';
import { RecentActivity } from '@/lib/mock-data';

interface RecentActivitiesTableProps {
  activities: RecentActivity[];
  onRowClick?: (activity: RecentActivity) => void;
}

const healthColorMap = {
  success: {
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  warning: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-200',
  },
  error: {
    bg: 'bg-red-500',
    ring: 'ring-red-200',
  },
};

export function RecentActivitiesTable({ activities, onRowClick }: RecentActivitiesTableProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-lg font-semibold text-gray-900">
        Recent Activities
      </h2>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[140px_140px_1fr_120px_160px_120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Time
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Type
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Summary
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
            Health
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            From
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Duration
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => {
            const healthColors = healthColorMap[activity.callHealth];

            return (
              <button
                key={activity.id}
                onClick={() => onRowClick?.(activity)}
                className="grid grid-cols-[140px_140px_1fr_120px_160px_120px] gap-4 px-6 py-4 w-full hover:bg-gray-50 transition-colors duration-150 cursor-pointer text-left"
              >
                {/* Time */}
                <div className="text-sm text-gray-600">
                  {activity.time}
                </div>

                {/* Type */}
                <div className="flex items-center gap-2">
                  <Image
                    src={`/icons/${activity.icon}.svg`}
                    alt=""
                    width={18}
                    height={18}
                    className="w-4.5 h-4.5 opacity-60"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {activity.type}
                  </span>
                </div>

                {/* Summary */}
                <div className="text-sm text-gray-700 truncate">
                  {activity.summary}
                </div>

                {/* Call Health */}
                <div className="flex justify-center items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${healthColors.bg} ring-2 ${healthColors.ring}`} />
                </div>

                {/* From */}
                <div className="text-sm text-gray-600 font-mono">
                  {activity.from}
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-600">
                  {activity.duration}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
