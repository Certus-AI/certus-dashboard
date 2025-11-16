'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const supportCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'Rocket',
      description: 'Learn the basics of your Certus dashboard',
      articles: 5,
    },
    {
      id: 'call-management',
      title: 'Call Management',
      icon: 'Phone',
      description: 'Understanding your calls and transcripts',
      articles: 8,
    },
    {
      id: 'menu-updates',
      title: 'Menu Updates',
      icon: 'ForkKnife',
      description: 'Updating your menu and AI knowledge',
      articles: 4,
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      icon: 'CreditCard',
      description: 'Subscription and payment information',
      articles: 6,
    },
  ]

  const quickLinks = [
    {
      title: 'Contact Support',
      description: 'Email us at support@certus.com',
      icon: 'EnvelopeSimple',
      action: 'mailto:support@certus.com',
    },
    {
      title: 'Schedule Training',
      description: 'Book a 1-on-1 session with our team',
      icon: 'CalendarBlank',
      action: '#',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: 'PlayCircle',
      action: '#',
    },
  ]

  return (
    <div className="flex flex-col gap-6 px-8 py-6 flex-1 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Support & Help</h1>
        <p className="text-sm text-gray-600">
          Get help with your Certus dashboard
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 opacity-40">
            <Image
              src="/icons/MagnifyingGlass.svg"
              alt=""
              width={20}
              height={20}
            />
          </div>
          <Input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <a
            key={link.title}
            href={link.action}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-red-50 to-pink-50">
                <Image
                  src={`/icons/${link.icon}.svg`}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 opacity-60"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {link.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Help Categories */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Browse by Topic</h2>
        <div className="grid grid-cols-2 gap-4">
          {supportCategories.map((category) => (
            <button
              key={category.id}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/20">
                  <Image
                    src={`/icons/${category.icon}.svg`}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                      {category.title}
                    </h3>
                    <span className="text-xs font-medium text-gray-500">
                      {category.articles} articles
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100 p-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Still need help?
            </h2>
            <p className="text-sm text-gray-600">
              Our support team is here to assist you
            </p>
          </div>
          <Button className="bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-200">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
