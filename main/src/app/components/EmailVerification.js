'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';

export default function EmailVerification({ email, onVerified }) {
  const { resendConfirmation } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setMessage('');

    const { data, error } = await resendConfirmation(email);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Verification email sent! Please check your inbox and spam folder.');
      setResendCount(prev => prev + 1);
      setLastResendTime(Date.now());
      setCooldown(60); // 60 second cooldown
    }

    setResending(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We've sent a verification link to{' '}
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
            Please click the link in the email to verify your account.
          </p>

          {/* Status Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={resending || cooldown > 0}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <Mail className="-ml-1 mr-2 h-4 w-4" />
                {resendCount > 0 ? 'Resend Email' : 'Send Again'}
              </>
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Didn't receive the email?</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure {email} is correct</li>
              <li>• Try resending the email</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Still having trouble?{' '}
              <a
                href="mailto:admin@infinitypotential.org"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <a
          href="/auth/login"
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          ← Back to Sign In
        </a>
      </div>
    </div>
  );
}
