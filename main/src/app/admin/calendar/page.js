'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useTimezone } from '@/app/context/TimezoneContext';
import { useToast } from '@/app/context/ToastContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  AlertCircle,
  Save,
  X
} from 'lucide-react';

export default function AdminCalendar() {
  const { user, loading } = useAuth();
  const { userTimezone, formatTimeInTimezone, formatDateInTimezone } = useTimezone();
  const router = useRouter();
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [busySlots, setBusySlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddBusyModal, setShowAddBusyModal] = useState(false);
  const [newBusySlot, setNewBusySlot] = useState({ 
    date: '', 
    startTime: '', 
    endTime: '', 
    reason: '', 
    awayStatus: false 
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  const loadCalendarData = useCallback(async (date, signal) => {
    setLoadingData(true);
    // Do not clear data here to avoid flashing, will be replaced on success
    
  const dateStr = formatYMDLocal(date);
    console.log(`Frontend: Fetching data for date: ${dateStr}`);

    try {
      const response = await fetch(`/api/admin/calendar-slots?date=${dateStr}`, { signal });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (!signal.aborted) {
        console.log(`Frontend: Successfully loaded data for ${dateStr}`);
        setBookings(data.bookings || []);
        setBusySlots(data.busySlots || []);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Frontend: Fetch aborted for ${dateStr}`);
      } else {
        console.error('Error loading calendar data:', error);
      }
    } finally {
      if (!signal.aborted) {
        setLoadingData(false);
      }
    }
  }, []); // Memoize the function

  // Load calendar data when user or selectedDate changes
  useEffect(() => {
    if (user) {
      const abortController = new AbortController();
      loadCalendarData(selectedDate, abortController.signal);

      return () => {
        abortController.abort();
      };
    }
  }, [user, selectedDate, loadCalendarData]);

  const handleDateChange = (date) => {
  const newDateStr = formatYMDLocal(date);
  const oldDateStr = formatYMDLocal(selectedDate);
    if (newDateStr !== oldDateStr) {
      console.log(`Frontend: Date changed to ${newDateStr}`);
      setSelectedDate(date);
    }
  };

  const refreshData = () => {
    // Trigger a re-fetch by creating a new Date object instance
    setSelectedDate(new Date(selectedDate.getTime()));
  };

  const markSlotAsBusy = async (slotData) => {
    try {
      const response = await fetch('/api/admin/calendar-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_busy',
          ...slotData
        })
      });

      if (response.ok) {
        refreshData(); // Refresh data
        setShowAddBusyModal(false);
        setNewBusySlot({ date: '', startTime: '', endTime: '', reason: '', awayStatus: false });
      }
    } catch (error) {
      console.error('Error marking slot as busy:', error);
    }
  };

  const removeBooking = async (bookingId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to remove this booking?',
      {
        title: 'Remove Booking',
        confirmText: 'Remove',
        variant: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refreshData(); // Refresh data
      }
    } catch (error) {
      console.error('Error removing booking:', error);
    }
  };

  const removeBusySlot = async (busySlotId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to remove this busy slot?',
      {
        title: 'Remove Busy Slot',
        confirmText: 'Remove',
        variant: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/calendar-slots/${busySlotId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refreshData(); // Refresh data
      }
    } catch (error) {
      console.error('Error removing busy slot:', error);
    }
  };

  const handleAddBusySlot = () => {
    const date = newBusySlot.date || formatYMDLocal(selectedDate);
    if (!date || !newBusySlot.startTime || !newBusySlot.endTime) {
      warning('Please fill in all required fields');
      return;
    }

    markSlotAsBusy({
      ...newBusySlot,
      date
    });
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatTime = (time) => {
    // Handle both ISO timestamp strings and time-only strings
    const date = time.includes('T') ? new Date(time) : new Date(`2000-01-01T${time}`);
    return formatTimeInTimezone(date, userTimezone, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format a Date object as YYYY-MM-DD using local time (no UTC shift)
  const formatYMDLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return formatDateInTimezone(date, userTimezone, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Calendar Management</h1>
                <p className="text-sm text-gray-400">Manage bookings, busy slots, and availability</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-gray-400 hover:text-white font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => handleDateChange(new Date())}
                    className="px-4 py-2 text-sm bg-yellow-400 text-gray-900 rounded hover:bg-yellow-500"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
                    {day}
                  </div>
                ))}
                {generateCalendarDays().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        console.log(`Frontend: Clicked on date ${formatYMDLocal(day)} (${day.toDateString()})`);
                        handleDateChange(day);
                      }}
                      className={`
                        p-2 text-sm rounded hover:bg-gray-700 transition-colors
                        ${isCurrentMonth ? 'text-white' : 'text-gray-500'}
                        ${isSelected ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' : ''}
                        ${isToday && !isSelected ? 'bg-gray-700 text-yellow-400' : ''}
                      `}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day Details */}
          <div className="space-y-6">
            {/* Add Busy Slot Button */}
            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Quick Actions</h3>
              </div>
              <button
                onClick={() => setShowAddBusyModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Mark Time as Busy</span>
              </button>
            </div>

            {/* Selected Day Info */}
            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </h3>

              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">Loading day details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bookings */}
                  {bookings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Bookings ({bookings.length})
                      </h4>
                      <div className="space-y-2">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-700 border border-gray-600 rounded p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-green-400" />
                                <span className="text-sm font-medium text-white">{booking.customer_email}</span>
                              </div>
                              <button
                                onClick={() => removeBooking(booking.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 mt-1">
                              {booking.booking_time} • {booking.booking_date}
                            </p>
                            <p className="text-sm text-gray-400">{booking.products?.name || 'Booking'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Busy Slots */}
                  {busySlots.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-2 flex items-center">
                        <XCircle className="h-4 w-4 text-red-400 mr-2" />
                        Busy Slots ({busySlots.length})
                      </h4>
                      <div className="space-y-2">
                        {busySlots.map((slot) => (
                          <div key={slot.id} className={`border rounded p-3 ${
                            slot.away_status 
                              ? 'bg-blue-900/20 border-blue-500/30' 
                              : 'bg-gray-700 border-gray-600'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {slot.away_status ? (
                                  <span className="text-blue-400">🚫</span>
                                ) : (
                                  <Clock className="h-4 w-4 text-red-400" />
                                )}
                                <span className="text-sm font-medium text-white">{slot.title || 'Busy'}</span>
                                {slot.away_status && (
                                  <span className="px-2 py-1 bg-blue-800/30 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                    Away
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeBusySlot(slot.id)}
                                className={`hover:opacity-80 ${
                                  slot.away_status ? 'text-blue-400 hover:text-blue-300' : 'text-red-400 hover:text-red-300'
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 mt-1">
                              <span className="text-gray-400">{formatDate(slot.start_time)} •</span> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </p>
                            {slot.description && <p className="text-sm text-gray-400">{slot.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookings.length === 0 && busySlots.length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No bookings or busy slots for this day</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Busy Slot Modal */}
      {showAddBusyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Mark Time as Busy</h3>
              <button
                onClick={() => setShowAddBusyModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newBusySlot.date || formatYMDLocal(selectedDate)}
                  onChange={(e) => setNewBusySlot({ ...newBusySlot, date: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newBusySlot.startTime}
                    onChange={(e) => setNewBusySlot({ ...newBusySlot, startTime: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newBusySlot.endTime}
                    onChange={(e) => setNewBusySlot({ ...newBusySlot, endTime: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason (Optional)</label>
                <textarea
                  value={newBusySlot.reason}
                  onChange={(e) => setNewBusySlot({ ...newBusySlot, reason: e.target.value })}
                  placeholder="e.g., Personal appointment, Break, Meeting..."
                  className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  rows="3"
                />
              </div>

              {/* Away Status Option */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="awayStatus"
                    checked={newBusySlot.awayStatus}
                    onChange={(e) => setNewBusySlot({ ...newBusySlot, awayStatus: e.target.checked })}
                    className="rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="awayStatus" className="text-sm font-medium text-blue-300 cursor-pointer">
                      🚫 Mark as "Away" / "Not Available"
                    </label>
                    <p className="text-xs text-blue-200 mt-1">
                      Use this for sleeping time, physical activity, or when you're completely unavailable for any sessions
                    </p>
                  </div>
                </div>
                
                {newBusySlot.awayStatus && (
                  <div className="mt-3 p-3 bg-blue-800/20 rounded border border-blue-600/30">
                    <p className="text-sm text-blue-200">
                      <strong>💡 Away Status:</strong> This will block all bookings during this time period and show you as "Not Available" to clients.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddBusyModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBusySlot}
                className={`px-4 py-2 text-white rounded flex items-center space-x-2 transition-colors ${
                  newBusySlot.awayStatus 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Save className="h-4 w-4" />
                <span>{newBusySlot.awayStatus ? 'Mark as Away' : 'Mark as Busy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
