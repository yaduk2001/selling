'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  Settings, 
  Home, 
  FileText, 
  Download,
  CreditCard,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function DashboardSidebar({ 
  activeTab, 
  setActiveTab, 
  profile, 
  user,
  onSignOut,
  signingOut,
  isOpen,
  setIsOpen 
}) {
  const router = useRouter();

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const quickActions = [
    {
      label: 'Re-download PDF',
      icon: Download,
      action: () => router.push('/download'),
      description: 'Download your purchased PDFs again'
    },
    {
      label: 'Browse Products',
      icon: FileText,
      action: () => router.push('/'),
      description: 'Explore our products and services'
    },
    {
      label: 'Book New Session',
      icon: Calendar,
      action: () => router.push('/#services'),
      description: 'Schedule a new coaching session'
    }
  ];

  const userInitial = profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand/Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-blue-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SI</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Selling Infinity
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dashboard
            </p>
          </div>
        </Link>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 dark:bg-yellow-400 rounded-full flex items-center justify-center text-white dark:text-gray-900 text-lg font-medium">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Dashboard
          </h4>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Quick Actions
          </h4>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className="w-full flex items-start px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon size={18} className="mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Home Link */}
        <div className="mt-8 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Navigation
          </h4>
          <Link
            href="/"
            className="w-full flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Home size={18} className="mr-3" />
            Back to Website
          </Link>
        </div>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            onSignOut();
            setIsOpen(false);
          }}
          disabled={signingOut}
          className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <LogOut size={18} className="mr-3" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-80
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </div>
    </>
  );
}
