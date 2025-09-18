// FILE: src/app/components/home/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function Header() {
  const { user, signOut, getProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState(null);

  // Check if we're on the homepage
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (user && !profile) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await getProfile();
    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Still proceed with local cleanup even if server signout fails
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    } finally {
      setSigningOut(false);
      setShowUserMenu(false);
      // Force redirect to home page after signout attempt
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Account';
  const userInitial = profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-lg border-b border-gray-700">
      <div className="content-container container-padding">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex flex-col items-center group">
            <div className="flex items-center space-x-3">
              <Image
                src="/Logo.png"
                alt="Company Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl text-orange-500 leading-tight">
                  Selling Infinity
                </span>
                <span className="text-xs text-gray-400 leading-tight">
                  Sales Excellence Training
                </span>
              </div>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {isHomePage ? (
              // Homepage section links
              <>
                <a href="#home" className="text-gray-300 hover:text-orange-400 transition-colors">Home</a>
                <a href="#services" className="text-gray-300 hover:text-orange-400 transition-colors">Services</a>
                <a href="#about" className="text-gray-300 hover:text-orange-400 transition-colors">About</a>
                <a href="#testimonials" className="text-gray-300 hover:text-orange-400 transition-colors">Testimonials</a>
              </>
            ) : (
              // Regular page links
              <>
                <Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors">Home</Link>
                <Link href="/#services" className="text-gray-300 hover:text-orange-400 transition-colors">Services</Link>
                <Link href="/#about" className="text-gray-300 hover:text-orange-400 transition-colors">About</Link>
                <Link href="/#testimonials" className="text-gray-300 hover:text-orange-400 transition-colors">Testimonials</Link>
              </>
            )}
            
            {user ? (
              // Authenticated user menu
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-orange-400 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userInitial}
                  </div>
                  <span className="text-sm">
                    {displayName}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700">
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <hr className="my-1 border-gray-700" />
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                      >
                        {signingOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Guest user buttons
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-orange-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-button"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="px-4 py-4 space-y-4">
              {isHomePage ? (
                // Homepage section links
                <>
                  <a 
                    href="#home" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                  <a 
                    href="#services" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Services
                  </a>
                  <a 
                    href="#about" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About
                  </a>
                  <a 
                    href="#testimonials" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Testimonials
                  </a>
                </>
              ) : (
                // Regular page links
                <>
                  <Link 
                    href="/" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/#services" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Services
                  </Link>
                  <Link 
                    href="/#about" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About
                  </Link>
                  <Link 
                    href="/#testimonials" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Testimonials
                  </Link>
                </>
              )}
              
              <hr className="border-gray-200 dark:border-gray-700" />
              
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 dark:bg-yellow-400 rounded-full flex items-center justify-center text-white dark:text-gray-900 text-sm font-medium">
                      {userInitial}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {displayName}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    disabled={signingOut}
                    className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block btn-primary text-button text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </nav>
  );
}
