import React from 'react';
import Image from 'next/image';

interface KPITileProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  highlighted?: boolean;
}

export function KPITile({ icon, label, value, trend, highlighted = false }: KPITileProps) {
  // Revenue gets special treatment for restaurant owners
  const isRevenue = label.toLowerCase().includes('revenue');
  const shouldHighlight = highlighted || isRevenue;

  return (
    <div className={`group relative flex flex-col flex-1 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
      shouldHighlight
        ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100'
        : 'bg-white border-gray-100'
    }`}>
      {/* Card Content */}
      <div className="flex flex-col h-full p-6">
        {/* Icon + Label */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 ${
            shouldHighlight
              ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-sm'
              : 'bg-gradient-to-br from-red-50 to-pink-50 group-hover:from-red-100 group-hover:to-pink-100'
          }`}>
            <Image
              src={`/icons/${icon}.svg`}
              alt=""
              width={20}
              height={20}
              className="w-5 h-5"
              style={shouldHighlight
                ? { filter: 'brightness(0) invert(1)' }
                : { filter: 'invert(28%) sepia(79%) saturate(3645%) hue-rotate(337deg) brightness(93%) contrast(91%)' }
              }
            />
          </div>
          <div className={`text-sm font-medium ${shouldHighlight ? 'text-red-900' : 'text-gray-600'}`}>
            {label}
          </div>
        </div>

        {/* Value */}
        <div className="mt-auto">
          <div className={`text-2xl font-bold ${shouldHighlight ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              <span className={`${trend.direction === 'up' ? 'rotate-0' : 'rotate-180'}`}>↑</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle gradient overlay on hover */}
      {!shouldHighlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-50/0 group-hover:to-red-50/20 transition-all duration-200 pointer-events-none" />
      )}
    </div>
  );
}
