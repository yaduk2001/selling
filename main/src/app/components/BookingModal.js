// FILE: src/app/components/BookingModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useTimezone } from '@/app/context/TimezoneContext';
import { formatTimeInTimezone, formatDateInTimezone } from '@/lib/timezone-utils';

export default function BookingModal({ isOpen, onClose, product, onBookingComplete }) {
  const { user } = useAuth(); // Get current user
  const { userTimezone, formatTimeInTimezone: formatTime, formatDateInTimezone: formatDate } = useTimezone();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [reservationExpiry, setReservationExpiry] = useState(null);
  const [error, setError] = useState('');

  // Get booking duration from product
  const getBookingDuration = (product) => {
    // Check product metadata for duration, default to 60 minutes
    return product?.duration_minutes || 60;
  };

  // Generate next 30 days for calendar
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const toYMDLocal = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: toYMDLocal(date),
        display: formatDate(date, userTimezone, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        dayName: formatDate(date, userTimezone, { weekday: 'long' })
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Fetch available slots for selected date
  useEffect(() => {
    if (selectedDate && isOpen && product) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, isOpen, product]);

  const fetchAvailableSlots = async (date) => {
    setLoading(true);
    setError('');
    
    try {
      const duration = getBookingDuration(product);
      const response = await fetch(`/api/booking/availability?date=${date}&productId=${product.id}&duration=${duration}&timezone=${encodeURIComponent(userTimezone)}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.availableSlots);
      } else {
        setError(data.error || 'Failed to fetch availability');
      }
    } catch (err) {
      setError('Failed to load available times');
    } finally {
      setLoading(false);
    }
  };

  // Reserve a time slot
  const reserveSlot = async (date, time) => {
    setLoading(true);
    setError('');

    try {
      const duration = getBookingDuration(product);
      const response = await fetch('/api/booking/reserve-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          bookingDate: date,
          bookingTime: time,
          duration: duration,
          timezone: userTimezone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReservationId(data.reservationId);
        setReservationExpiry(new Date(data.expiresAt));
        setSelectedTime(time);
        
        // Start countdown timer
        startCountdown(data.expiresAt);
      } else {
        setError(data.error || 'Failed to reserve slot');
      }
    } catch (err) {
      setError('Failed to reserve time slot');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for reservation
  const [timeRemaining, setTimeRemaining] = useState(null);

  const startCountdown = (expiryTime) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(null);
        setReservationId(null);
        setSelectedTime('');
        clearInterval(interval);
        setError('Reservation expired. Please select a new time.');
      }
    }, 1000);

    return interval;
  };

  // Proceed to payment
  const proceedToPayment = async () => {
    if (!reservationId) {
      setError('No valid reservation found');
      return;
    }

    setLoading(true);
    
    try {
      const duration = getBookingDuration(product);
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          reservationId: reservationId,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          duration: duration,
          userId: user?.id || null, // Include user ID if user is logged in
          customerEmail: user?.email || null, // Include user email if available
          createAccountAfterPurchase: !user, // Flag to indicate account creation needed
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Failed to proceed to payment');
    } finally {
      setLoading(false);
    }
  };

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setReservationId(null);
      setReservationExpiry(null);
      setTimeRemaining(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Book Your Coaching Session
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{product.name}</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-blue-900 dark:text-blue-100 font-medium">${(product.price / 100).toFixed(0)}</p>
              <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full">
                📅 {getBookingDuration(product)} minutes
              </div>
            </div>
          </div>

          {/* Step 1: Select Date */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Calendar className="mr-2" size={20} />
              Step 1: Choose a Date
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {calendarDays.slice(0, 15).map((day) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedDate === day.date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{day.dayName}</div>
                  <div className="text-xs">{day.display}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Time */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="mr-2" size={20} />
                Step 2: Choose a Time
              </h3>
              
              {loading ? (
                <div className="text-center py-4">Loading available times...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => reserveSlot(selectedDate, slot.time)}
                      disabled={loading || reservationId}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedTime === slot.time && reservationId
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50'
                      }`}
                    >
                      <div className="font-medium">{slot.time}</div>
                      {slot.endTime && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          to {slot.endTime}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reservation Confirmation */}
          {reservationId && timeRemaining && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="text-green-600 dark:text-green-400 mr-2" size={20} />
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Slot Reserved!
                </h4>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm mb-2">
                Your {getBookingDuration(product)}-minute session on {formatDate(selectedDate, userTimezone)} at {selectedTime} is reserved.
              </p>
              <p className="text-green-600 dark:text-green-400 font-medium">
                Time remaining: {timeRemaining}
              </p>
            </div>
          )}

          {/* Proceed to Payment Button */}
          <div className="flex justify-end">
            <button
              onClick={proceedToPayment}
              disabled={!reservationId || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
