import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { Clock, Calendar, Save, Edit, Trash2, Plus, X } from 'lucide-react';

const BusinessHoursManager = () => {
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '10:00', end: '16:00' },
    sunday: { enabled: false, start: '10:00', end: '16:00' }
  });
  
  const [breaks, setBreaks] = useState([
    { id: 1, name: 'Lunch Break', start: '12:00', end: '13:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
  ]);
  
  const [holidays, setHolidays] = useState([
    { id: 1, name: 'Christmas Day', date: '2025-12-25', recurring: true },
    { id: 2, name: 'New Year\'s Day', date: '2026-01-01', recurring: true }
  ]);
  
  const [editingBreak, setEditingBreak] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [breakFormData, setBreakFormData] = useState({
    id: null,
    name: '',
    start: '',
    end: '',
    days: []
  });
  const [holidayFormData, setHolidayFormData] = useState({
    id: null,
    name: '',
    date: '',
    recurring: false
  });

  // Load existing business hours
  useEffect(() => {
    const loadBusinessHours = async () => {
      try {
        const response = await fetch('/api/admin/business-hours');
        const result = await response.json();
        
        if (result.success && result.businessHours) {
          // Convert database format to component format
          const hoursData = {};
          const dayMapping = {
            0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
            4: 'thursday', 5: 'friday', 6: 'saturday'
          };

          result.businessHours.forEach(dayData => {
            const dayName = dayMapping[dayData.day_of_week];
            if (dayName) {
              hoursData[dayName] = {
                enabled: dayData.is_working_day,
                start: dayData.start_time.substring(0, 5), // Remove seconds
                end: dayData.end_time.substring(0, 5)
              };
            }
          });

          // Fill in any missing days with defaults
          Object.keys(dayNames).forEach(day => {
            if (!hoursData[day]) {
              hoursData[day] = {
                enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day),
                start: '09:00',
                end: '17:00'
              };
            }
          });

          setBusinessHours(hoursData);
        }
      } catch (error) {
        console.error('Error loading business hours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBusinessHours();
  }, []);

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const handleHoursChange = (day, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveBusinessHours = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/business-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessHours, 
          breaks, 
          holidays 
        })
      });

      const result = await response.json();
      if (result.success) {
        success('Business hours saved successfully!');
      } else {
        showError('Failed to save: ' + result.error);
      }
    } catch (error) {
      showError('Error saving business hours: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addBreak = () => {
    setBreakFormData({
      id: null,
      name: 'New Break',
      start: '12:00',
      end: '13:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    setShowBreakForm(true);
  };

  const updateBreak = (id, field, value) => {
    setBreaks(breaks.map(br => 
      br.id === id ? { ...br, [field]: value } : br
    ));
  };

  const deleteBreak = async (id) => {
    const confirmed = await showConfirm(
      'Delete this break?',
      {
        title: 'Delete Break',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
    
    if (confirmed) {
      setBreaks(breaks.filter(br => br.id !== id));
    }
  };

  const addHoliday = () => {
    setHolidayFormData({
      id: null,
      name: 'New Holiday',
      date: new Date().toISOString().split('T')[0],
      recurring: false
    });
    setShowHolidayForm(true);
  };

  const updateHoliday = (id, field, value) => {
    setHolidays(holidays.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const deleteHoliday = async (id) => {
    const confirmed = await showConfirm(
      'Delete this holiday?',
      {
        title: 'Delete Holiday',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
    
    if (confirmed) {
      setHolidays(holidays.filter(h => h.id !== id));
    }
  };

  const handleEditBreak = (breakItem) => {
    setBreakFormData(breakItem);
    setShowBreakForm(true);
  };

  const handleEditHoliday = (holiday) => {
    setHolidayFormData(holiday);
    setShowHolidayForm(true);
  };

  const handleBreakSubmit = async (e) => {
    e.preventDefault();
    const url = '/api/admin/business-hours';
    const method = breakFormData.id ? 'PUT' : 'POST';
    const body = {
      type: 'break',
      data: breakFormData
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success('Break saved successfully!');
        setShowBreakForm(false);
        loadBusinessHours();
      } else {
        showError('Failed to save break.');
      }
    } catch (error) {
      showError('Error saving break: ' + error.message);
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    const url = '/api/admin/business-hours';
    const method = holidayFormData.id ? 'PUT' : 'POST';
    const body = {
      type: 'holiday',
      data: holidayFormData
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success('Holiday saved successfully!');
        setShowHolidayForm(false);
        loadBusinessHours();
      } else {
        showError('Failed to save holiday.');
      }
    } catch (error) {
      showError('Error saving holiday: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-white">Loading business hours...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Business Hours */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Business Hours</h3>
              </div>
              <button
                onClick={handleSaveBusinessHours}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save All'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dayNames).map(([day, label]) => (
                <div key={day} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{label}</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={businessHours[day].enabled}
                        onChange={(e) => handleHoursChange(day, 'enabled', e.target.checked)}
                        className="mr-2 rounded bg-gray-600 border-gray-500 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-300">Open</span>
                </label>
              </div>
              
              {businessHours[day].enabled && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={businessHours[day].start}
                      onChange={(e) => handleHoursChange(day, 'start', e.target.value)}
                      className="w-full p-2 bg-gray-600 border border-gray-500 text-white rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={businessHours[day].end}
                      onChange={(e) => handleHoursChange(day, 'end', e.target.value)}
                      className="w-full p-2 bg-gray-600 border border-gray-500 text-white rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
              
              {!businessHours[day].enabled && (
                <div className="text-center py-4">
                  <span className="text-gray-400 text-sm">Closed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Breaks */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Breaks & Unavailable Times</h3>
          </div>
          <button
            onClick={addBreak}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Break</span>
          </button>
        </div>

        <div className="space-y-4">
          {breaks.map(breakItem => (
            <div key={breakItem.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{breakItem.name}</h4>
                  <p className="text-sm text-gray-400">
                    {breakItem.start} - {breakItem.end} | Active on: {breakItem.days.join(', ')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditBreak(breakItem)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteBreak(breakItem.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holidays */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Holidays & Special Dates</h3>
          </div>
          <button
            onClick={addHoliday}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Holiday</span>
          </button>
        </div>

        <div className="space-y-4">
          {holidays.map(holiday => (
            <div key={holiday.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{holiday.name}</h4>
                  <p className="text-sm text-gray-400">
                    {holiday.date} {holiday.recurring ? '(Recurring)' : ''}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditHoliday(holiday)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteHoliday(holiday.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}

      {showBreakForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {breakFormData.id ? 'Edit Break' : 'Add Break'}
            </h3>
            <form onSubmit={handleBreakSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Break Name</label>
                <input
                  type="text"
                  value={breakFormData.name}
                  onChange={(e) => setBreakFormData({ ...breakFormData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={breakFormData.start}
                    onChange={(e) => setBreakFormData({ ...breakFormData, start: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={breakFormData.end}
                    onChange={(e) => setBreakFormData({ ...breakFormData, end: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Active on days:</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dayNames).map(([day, label]) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={breakFormData.days.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...breakFormData.days, day]
                            : breakFormData.days.filter(d => d !== day);
                          setBreakFormData({ ...breakFormData, days: newDays });
                        }}
                        className="mr-1 rounded bg-gray-600 border-gray-500 text-orange-500"
                      />
                      <span className="text-sm text-gray-300">{label.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBreakForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  {breakFormData.id ? 'Update Break' : 'Add Break'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHolidayForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {holidayFormData.id ? 'Edit Holiday' : 'Add Holiday'}
            </h3>
            <form onSubmit={handleHolidaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={holidayFormData.name}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={holidayFormData.date}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={holidayFormData.recurring}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, recurring: e.target.checked })}
                  className="mr-2 rounded bg-gray-600 border-gray-500 text-orange-500"
                />
                <label htmlFor="recurring" className="text-gray-300">Recurring</label>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHolidayForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  {holidayFormData.id ? 'Update Holiday' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessHoursManager;
