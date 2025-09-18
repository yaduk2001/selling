'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BookingTestPage() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [bookingToken, setBookingToken] = useState('');
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBookingLink = async () => {
    setLoading(true);
    try {
      // First get debug data
      const debugResponse = await fetch(`/api/debug-booking-link?session_id=${sessionId}&booking_token=${bookingToken}`);
      const debugResult = await debugResponse.json();
      
      console.log('Debug data:', debugResult);
      setDebugData(debugResult);

      // If user is logged in, test the linking
      if (user && (sessionId || bookingToken)) {
        const linkResponse = await fetch('/api/debug-booking-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'test_link',
            sessionId,
            bookingToken,
            userId: user.id,
            email: user.email
          })
        });

        const linkResult = await linkResponse.json();
        console.log('Link test result:', linkResult);
      }

    } catch (error) {
      console.error('Error testing booking link:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🔧 Booking Link Debug Tool
        </h1>

        {user && (
          <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg mb-6">
            <h3 className="text-green-800 dark:text-green-200 font-semibold">Current User</h3>
            <p className="text-green-700 dark:text-green-300">ID: {user.id}</p>
            <p className="text-green-700 dark:text-green-300">Email: {user.email}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Parameters
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stripe Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="cs_test_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Booking Token
              </label>
              <input
                type="text"
                value={bookingToken}
                onChange={(e) => setBookingToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Generated booking token..."
              />
            </div>

            <button
              onClick={testBookingLink}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Booking Link'}
            </button>
          </div>
        </div>

        {debugData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Debug Results
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Analysis</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(debugData.analysis, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Transactions</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(debugData.debug.transactions, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Reservations</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(debugData.debug.reservations, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Bookings</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(debugData.debug.bookings, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
