'use client';

import React from 'react';

export default function AdminSidebar({ activeTab, setActiveTab, handleLogout, userEmail }) {
  return (
    <div className="w-64 bg-background text-text-primary flex flex-col p-4 shadow-lg border-r border-border">
      <div className="text-2xl font-bold text-primary mb-8">Admin Panel</div>
      
      <nav className="flex-1">
        <ul>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Dashboard
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'schedule' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Schedule
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'bookings' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Bookings
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'services' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Services
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'clients' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Clients
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'emails' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              📧 Email Templates
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Analytics
            </button>
          </li>
          <li className="mb-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-primary text-white' : 'hover:bg-surface text-text-primary'
              }`}
            >
              Settings
            </button>
          </li>
        </ul>
      </nav>

      <div className="border-t border-border pt-4 mt-4">
        <span className="block text-sm text-text-secondary mb-2">{userEmail}</span>
        <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
}