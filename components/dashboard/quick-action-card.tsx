'use client';

import React from 'react';
import Image from 'next/image';

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
}

export function QuickActionCard({ icon, title, description, badge, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between px-4 py-3 w-full bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-150">
          <Image
            src={`/icons/${icon}.svg`}
            alt=""
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <div className="flex flex-col items-start gap-0.5 flex-1">
          <div className="flex items-center gap-2 w-full">
            <div className="text-sm font-medium text-gray-900">
              {title}
            </div>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <Image
        src="/icons/CaretRight.svg"
        alt=""
        width={16}
        height={16}
        className="w-4 h-4 opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all duration-150"
      />
    </button>
  );
}
