'use client';

import React from 'react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/auth/sign-out-button';

interface DashboardHeaderProps {
  greeting: string;
  subtitle: string;
  userName?: string;
}

export function DashboardHeader({ greeting, subtitle, userName = 'GV' }: DashboardHeaderProps) {
  return (
    <header className="flex items-center gap-4 px-8 py-6 w-full bg-white border-b border-gray-100">
      <div className="flex flex-col gap-1 flex-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}
        </h1>
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Referral Banner */}
        <button
          className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-lg border border-red-100 transition-all duration-150"
          aria-label="Refer a friend and earn £200"
        >
          <p className="text-sm">
            <span className="font-semibold text-red-600">Earn £200</span>
            <span className="text-gray-600 ml-1">Refer a Friend</span>
          </p>
          <div className="w-4 h-4 opacity-40 group-hover:opacity-60 transition-opacity" aria-hidden="true">
            <Image
              src="/icons/vector.svg"
              alt=""
              width={16}
              height={16}
              className="w-full h-full"
            />
          </div>
        </button>

        {/* Notifications Bell */}
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          aria-label="Notifications"
        >
          <Image
            src="/icons/Bell.svg"
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 opacity-60"
          />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-10 h-10 items-center justify-center bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/30 transition-all duration-150"
              aria-label={`User profile: ${userName}`}
            >
              {userName}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton variant="ghost" showIcon={true} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
