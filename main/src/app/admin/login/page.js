// FILE: app/admin/login/page.js
// This is the login page for your admin panel using Supabase auth.

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn } = useAuth();
  const router = useRouter();

  // Redirect if already logged in and is admin
  useEffect(() => {
    if (user) {
      checkAdminStatus(user.email);
    }
  }, [user, router]);

  const checkAdminStatus = async (userEmail) => {
    try {
      const response = await fetch('/api/admin/check-admin-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await response.json();
      
      if (data.success && data.isAdmin) {
        router.push('/admin/dashboard');
      } else {
        setError('Access denied. Admin privileges required.');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Error verifying admin access.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await signIn(email, password);
    
    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      // Check admin status after successful login
      await checkAdminStatus(email);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 dark:bg-gray-900">
      <div className="bg-gray-800 dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">Admin Login</h2>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 p-3 rounded font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <a
            href="/auth/forgot-password"
            className="text-yellow-400 hover:text-yellow-300 text-sm"
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}