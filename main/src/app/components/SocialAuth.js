'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { FaGoogle, FaGithub } from 'react-icons/fa';

export default function SocialAuth({ mode = 'signin' }) {
  const { signInWithProvider } = useAuth();
  const [loading, setLoading] = useState({ google: false, github: false });
  const [error, setError] = useState('');

  const handleSocialLogin = async (provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    setError('');

    try {
      const { data, error: authError } = await signInWithProvider(provider);
      
      if (authError) {
        setError(authError.message);
      }
      // Success will be handled by the auth state change listener
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleSocialLogin('google')}
          disabled={loading.google}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.google ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <FaGoogle className="mr-3 text-red-500" size={18} />
              <span className="text-gray-700 font-medium">
                {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              </span>
            </>
          )}
        </button>

        <button
          onClick={() => handleSocialLogin('github')}
          disabled={loading.github}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.github ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <FaGithub className="mr-3 text-gray-800" size={18} />
              <span className="text-gray-700 font-medium">
                {mode === 'signin' ? 'Sign in with GitHub' : 'Sign up with GitHub'}
              </span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {mode === 'signin' ? 'Or sign in with email' : 'Or sign up with email'}
          </span>
        </div>
      </div>
    </div>
  );
}
