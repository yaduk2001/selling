import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { Calendar, Clock, Edit, Trash2, Plus, Save, X, Mail } from 'lucide-react';

const BusySlotsManager = () => {
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [busySlots, setBusySlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    reason: '',
    awayStatus: false
  });
  const [showNewSlotForm, setShowNewSlotForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(false);

  useEffect(() => {
    fetchBusySlots();
  }, [selectedDate]);

  const fetchBusySlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/calendar-slots?date=${selectedDate}`);
      const result = await response.json();
      if (result.success) {
        setBusySlots(result.busySlots || []);
      }
    } catch (error) {
      console.error('Error fetching busy slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusySlot = async () => {
    try {
      const response = await fetch('/api/admin/calendar-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_busy',
          ...newSlot,
          sendEmail: sendEmailNotification
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchBusySlots();
        setShowNewSlotForm(false);
        setNewSlot({
          date: selectedDate,
          startTime: '09:00',
          endTime: '10:00',
          reason: '',
          awayStatus: false
        });
        setSendEmailNotification(false);
        success('Busy slot created successfully!');
      } else {
        showError('Failed to create busy slot: ' + result.error);
      }
    } catch (error) {
      showError('Error creating busy slot: ' + error.message);
    }
  };

  const handleUpdateBusySlot = async (slotId, updatedData) => {
    try {
      const response = await fetch(`/api/admin/calendar-slots/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          sendEmail: sendEmailNotification
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchBusySlots();
        setEditingSlot(null);
        success('Busy slot updated successfully!');
      } else {
        showError('Failed to update busy slot: ' + result.error);
      }
    } catch (error) {
      showError('Error updating busy slot: ' + error.message);
    }
  };

  const handleDeleteBusySlot = async (slotId, slotInfo) => {
    const confirmed = await showConfirm(
      `Delete busy slot from ${slotInfo.date} ${slotInfo.time}?`,
      {
        title: 'Delete Busy Slot',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/calendar-slots/${slotId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: sendEmailNotification,
          slotInfo: slotInfo
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchBusySlots();
        success('Busy slot deleted successfully!');
      } else {
        showError('Failed to delete busy slot: ' + result.error);
      }
    } catch (error) {
      showError('Error deleting busy slot: ' + error.message);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const EditSlotForm = ({ slot, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: slot.title || '',
      description: slot.description || '',
      start_time: slot.start_time ? slot.start_time.slice(0, 16) : '',
      end_time: slot.end_time ? slot.end_time.slice(0, 16) : '',
      awayStatus: slot.away_status || false
    });

    return (
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full p-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                className="w-full p-3 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          {/* Away Status Option */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="awayStatusEdit"
                checked={formData.awayStatus}
                onChange={(e) => setFormData({...formData, awayStatus: e.target.checked})}
                className="rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="awayStatusEdit" className="text-sm font-medium text-blue-300 cursor-pointer">
                  🚫 Mark as "Away" / "Not Available"
                </label>
                <p className="text-xs text-blue-200 mt-1">
                  Use this for sleeping time, physical activity, or when you're completely unavailable for any sessions
                </p>
              </div>
            </div>
            
            {formData.awayStatus && (
              <div className="mt-3 p-3 bg-blue-800/20 rounded border border-blue-600/30">
                <p className="text-sm text-blue-200">
                  <strong>💡 Away Status:</strong> This will block all bookings during this time period and show you as "Not Available" to clients.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmailUpdate"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="rounded bg-gray-600 border-gray-500 text-orange-500"
            />
            <label htmlFor="sendEmailUpdate" className="text-sm text-gray-300 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Send email notification to affected clients
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(slot.id, formData)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Update</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Busy Slots Manager</h3>
        </div>
        <button
          onClick={() => setShowNewSlotForm(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Busy Slot</span>
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-300">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={fetchBusySlots}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* New Slot Form */}
      {showNewSlotForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Create New Busy Slot</h4>
            <button
              onClick={() => setShowNewSlotForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason (Optional)</label>
              <input
                type="text"
                value={newSlot.reason}
                onChange={(e) => setNewSlot({...newSlot, reason: e.target.value})}
                placeholder="Meeting, personal appointment, etc."
                className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            {/* Away Status Option */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="awayStatus"
                  checked={newSlot.awayStatus}
                  onChange={(e) => setNewSlot({...newSlot, awayStatus: e.target.checked})}
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
              
              {newSlot.awayStatus && (
                <div className="mt-3 p-3 bg-blue-800/20 rounded border border-blue-600/30">
                  <p className="text-sm text-blue-200">
                    <strong>💡 Away Status:</strong> This will block all bookings during this time period and show you as "Not Available" to clients.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmailNew"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="rounded bg-gray-600 border-gray-500 text-orange-500"
              />
              <label htmlFor="sendEmailNew" className="text-sm text-gray-300 flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                Send email notification to affected clients
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewSlotForm(false)}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBusySlot}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Busy Slots List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-white">
            Busy Slots for {formatDate(selectedDate)}
            {loading && <span className="text-gray-400 text-sm ml-2">(Loading...)</span>}
          </h4>
        </div>
        
        <div className="p-6">
          {busySlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No busy slots found for this date</p>
              <p className="text-gray-500 text-sm mt-1">All time slots are available for booking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {busySlots.map(slot => (
                <div key={slot.id}>
                  {editingSlot === slot.id ? (
                    <EditSlotForm
                      slot={slot}
                      onSave={handleUpdateBusySlot}
                      onCancel={() => setEditingSlot(null)}
                    />
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-white">
                              <Clock className="h-4 w-4 text-orange-400" />
                              <span className="font-medium">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            <div className="text-gray-300">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{slot.title || 'Busy - Admin Block'}</span>
                                {slot.away_status && (
                                  <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded-full border border-red-500/30">
                                    🚫 Away
                                  </span>
                                )}
                              </div>
                              {slot.description && (
                                <span className="text-gray-400 text-sm ml-2">• {slot.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            Created: {new Date(slot.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingSlot(slot.id)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit busy slot"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBusySlot(slot.id, {
                              date: formatDate(slot.start_time),
                              time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
                            })}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete busy slot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusySlotsManager;
