'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

function AccountSetupContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const bookingToken = searchParams.get('booking_token'); // Get booking token for secure linking
  const { signUp, signIn } = useAuth();

  useEffect(() => {
    // Fetch session data to get customer email
    if (sessionId) {
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.customerEmail) {
            setSessionData(data);
            const customerEmail = data.customerEmail;
            setEmail(customerEmail);
            
            // Check if account already exists with this email
            if (customerEmail) {
              checkAccountExists(customerEmail);
            }
          }
        })
        .catch(err => console.error('Error fetching session:', err));
    }
  }, [sessionId]);

  const checkAccountExists = async (email) => {
    try {
      const response = await fetch(`/api/check-account-exists?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists) {
        setAccountExists(true);
        console.log('Account exists for email:', email);
      } else {
        setAccountExists(false);
        console.log('No existing account for email:', email);
      }
    } catch (err) {
      console.log('Could not check account existence:', err);
      setAccountExists(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Only validate password matching for new accounts (sign-up)
    if (!accountExists && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      let authData, authError;
      
      if (accountExists) {
        // Sign in to existing account
        const result = await signIn(email, password);
        authData = result.data;
        authError = result.error;
      } else {
        // Create new account
        const result = await signUp(email, password);
        authData = result.data;
        authError = result.error;
      }
      
      if (authError) {
        setError(authError.message);
        return;
      }

      // Account authenticated successfully, now link it to the purchase
      if (authData?.user && (sessionId || bookingToken)) {
        try {
          const linkResponse = await fetch('/api/link-account-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionId,
              bookingToken: bookingToken, // Use secure booking token for linking
              userId: authData.user.id,
              email: email
            })
          });

          const linkResult = await linkResponse.json();
          
          if (linkResult.success) {
            console.log('Account successfully linked to purchase:', linkResult);
            // Redirect to dashboard with success message
            router.push('/dashboard?welcome=true&linked=true');
          } else {
            console.error('Failed to link account to purchase:', linkResult.error);
            // Still redirect to dashboard but without success message
            router.push('/dashboard?welcome=true&linked=false');
          }
        } catch (linkError) {
          console.error('Error linking account to purchase:', linkError);
          // Still redirect to dashboard
          router.push('/dashboard?welcome=true&linked=false');
        }
      } else {
        // No session or booking token to link, just redirect
        router.push('/dashboard?welcome=true');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }

      // Account signed in successfully, now link it to the purchase
      if (data?.user && (sessionId || bookingToken)) {
        try {
          const linkResponse = await fetch('/api/link-account-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionId,
              bookingToken: bookingToken,
              userId: data.user.id,
              email: email
            })
          });

          const linkResult = await linkResponse.json();
          
          if (linkResult.success) {
            console.log('Account successfully linked to purchase:', linkResult);
            // Redirect to dashboard with success message
            router.push('/dashboard?welcome=true&linked=true&signed_in=true');
          } else {
            console.error('Failed to link account to purchase:', linkResult.error);
            // Still redirect to dashboard but without success message
            router.push('/dashboard?welcome=true&linked=false&signed_in=true');
          }
        } catch (linkError) {
          console.error('Error linking account to purchase:', linkError);
          // Still redirect to dashboard
          router.push('/dashboard?welcome=true&linked=false&signed_in=true');
        }
      } else {
        // No session or booking token to link, just redirect
        router.push('/dashboard?signed_in=true');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            🎉 Payment Successful!
          </h2>
          <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
            {accountExists ? 'Sign In to Your Account' : 'Complete Your Account Setup'}
          </h3>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {accountExists ? (
              <>
                Your purchase is complete! We found an existing account with this email address. 
                Please sign in to link your purchase to your account.
              </>
            ) : (
              <>
                Your purchase is complete! Now create your account to access your products, download PDFs, 
                and manage your coaching sessions. Your email from the purchase will be used for your account.
              </>
            )}
            {bookingToken && (
              <span className="block mt-2 text-xs text-green-600">
                Secure booking link ready: {bookingToken.substring(0, 8)}...
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {sessionData && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Payment Successful!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>Amount: ${sessionData.amountPaid ? sessionData.amountPaid.toFixed(2) : 'Processing...'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!sessionData}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {!accountExists && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (accountExists ? 'Signing In...' : 'Creating Account...') : (accountExists ? 'Sign In & Link Purchase' : 'Create Account & Access Dashboard')}
              </button>
            </div>

            {accountExists && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAccountExists(false)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Don't have an account? Create new account instead
                </button>
              </div>
            )}

            {!accountExists && email && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAccountExists(true)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Already have an account? Sign in instead
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                {accountExists ? (
                  <>
                    <li>✅ Sign in to your existing account</li>
                    <li>✅ Your purchase will be linked automatically</li>
                    <li>✅ Access your updated dashboard immediately</li>
                  </>
                ) : (
                  <>
                    <li>✅ Your account will be created instantly</li>
                    <li>✅ Your purchase will be linked to your account</li>
                    <li>✅ You'll get immediate access to your dashboard</li>
                  </>
                )}
                <li>✅ Download PDFs or book coaching sessions right away</li>
              </ul>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 Your information is secure and encrypted. 
              You can log in on any device to access your purchases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="font-heading text-2xl mb-4 text-blue-600 dark:text-yellow-400">Loading...</div>
          <div className="text-gray-500 dark:text-gray-400">Setting up your account...</div>
        </div>
      </div>
    }>
      <AccountSetupContent />
    </Suspense>
  );
}
