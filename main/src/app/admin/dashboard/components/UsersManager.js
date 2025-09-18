import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { Users, Search, Mail, Ban, Trash2, Eye, EyeOff, UserCheck, UserX, AlertTriangle, MoreVertical, Filter, CheckCircle } from 'lucide-react';

function UsersManager() {
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showActions, setShowActions] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    id: null,
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Silently clear any expired bans first
      try {
        await fetch('/api/admin/clear-expired-bans', { method: 'POST' });
      } catch (error) {
        // Don't show error for this, just continue
        console.warn('Failed to clear expired bans:', error);
      }
      
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail) => {
    const confirmed = await showConfirm(
      `⚠️ Delete user "${userName}" (${userEmail})?\n\nThis will:\n• Delete all their bookings\n• Remove all their data\n• Send a cancellation email\n\nThis action cannot be undone.`,
      {
        title: 'Delete User',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: true,
          userName,
          userEmail
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        success(`User "${userName}" deleted successfully. Cancellation email sent.`);
      } else {
        showError('Failed to delete user: ' + result.error);
      }
    } catch (error) {
      showError('Error deleting user: ' + error.message);
    }
  };

  const handleBanUser = async (userId, userName, userEmail) => {
    const confirmed = await showConfirm(
      `Ban user "${userName}" (${userEmail})?\n\nThis will:\n• Disable their account\n• Cancel future bookings\n• Send a notification email`,
      {
        title: 'Ban User',
        confirmText: 'Ban',
        variant: 'danger'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: true,
          userName,
          userEmail
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        success(`User "${userName}" has been banned.`);
      } else {
        showError('Failed to ban user: ' + result.error);
      }
    } catch (error) {
      showError('Error banning user: ' + error.message);
    }
  };

  const handleUnbanUser = async (userId, userName, userEmail) => {
    const confirmed = await showConfirm(
      `Unban user "${userName}" (${userEmail})?\n\nThis will:\n• Re-enable their account\n• Allow them to make new bookings`,
      {
        title: 'Unban User',
        confirmText: 'Unban',
        variant: 'default'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        success(`User "${userName}" has been unbanned.`);
      } else {
        showError('Failed to unban user: ' + result.error);
      }
    } catch (error) {
      showError('Error unbanning user: ' + error.message);
    }
  };

  const handleSendEmail = async (userId, userName, userEmail, templateType = 'general_notification') => {
    const emailOptions = {
      'general_notification': 'General Notification',
      'booking_reminder': 'Booking Reminder',
      'account_update': 'Account Update Notice',
      'promotional': 'Promotional Email',
      'welcome_back': 'Welcome Back Message'
    };

    // Show a selection dialog using our toast system
    const selectedTemplate = await showConfirm(
      `Send email to "${userName}" (${userEmail})\n\nSelect template:\n${Object.entries(emailOptions).map(([key, value], index) => `${index + 1}. ${value}`).join('\n')}\n\nChoose the template to send:`,
      {
        title: 'Send Email',
        confirmText: 'Send General Notification',
        cancelText: 'Cancel',
        variant: 'default'
      }
    );

    if (!selectedTemplate) {
      return;
    }

    // For now, default to general_notification
    // TODO: Create a proper modal for template selection
    const templateKey = 'general_notification';

    try {
      const response = await fetch('/api/admin/send-user-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          userEmail,
          templateKey
        })
      });

      const result = await response.json();
      if (result.success) {
        success(`Email sent to "${userName}" successfully!`);
      } else {
        showError('Failed to send email: ' + result.error);
      }
    } catch (error) {
      showError('Error sending email: ' + error.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      warning('Please select users first');
      return;
    }

    let confirmMessage = '';
    let title = '';
    let variant = 'default';
    
    switch (action) {
      case 'delete':
        confirmMessage = `Delete ${selectedUsers.length} selected users?\n\nThis will permanently remove all their data and send cancellation emails.`;
        title = 'Delete Users';
        variant = 'danger';
        break;
      case 'ban':
        confirmMessage = `Ban ${selectedUsers.length} selected users?\n\nThis will disable their accounts and cancel future bookings.`;
        title = 'Ban Users';
        variant = 'danger';
        break;
      case 'email':
        confirmMessage = `Send email to ${selectedUsers.length} selected users?`;
        title = 'Send Email';
        break;
    }

    const confirmed = await showConfirm(confirmMessage, {
      title,
      confirmText: action === 'delete' ? 'Delete' : action === 'ban' ? 'Ban' : 'Send',
      variant
    });
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        setSelectedUsers([]);
        success(`Bulk ${action} completed: ${result.processed} users processed`);
      } else {
        showError(`Failed to perform bulk ${action}: ` + result.error);
      }
    } catch (error) {
      showError(`Error performing bulk ${action}: ` + error.message);
    }
  };

    const handleCleanupDuplicates = async () => {
    const confirmed = await showConfirm(
      'This will remove duplicate user accounts and keep only the most recent one for each email address.\n\nAre you sure you want to proceed?',
      {
        title: 'Cleanup Duplicate Users',
        confirmText: 'Yes, Cleanup',
        variant: 'destructive'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup-duplicate-users', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        success(result.message);
      } else {
        showError('Failed to cleanup duplicates: ' + result.error);
      }
    } catch (error) {
      showError('Error cleaning up duplicates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearExpiredBans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clear-expired-bans', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        if (result.clearedCount > 0) {
          success(result.message);
        } else {
          info('No expired bans found to clear.');
        }
      } else {
        showError('Failed to clear expired bans: ' + result.error);
      }
    } catch (error) {
      showError('Error clearing expired bans: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && !user.banned) ||
                         (filterStatus === 'banned' && user.banned) ||
                         (filterStatus === 'verified' && user.email_confirmed) ||
                         (filterStatus === 'unverified' && !user.email_confirmed);
    
    return matchesSearch && matchesFilter;
  });

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? []
        : filteredUsers.map(user => user.id)
    );
  };

  const handleEditUser = (user) => {
    setUserFormData(user);
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = `/api/admin/users/${editingUser.id}`;
    const method = 'PUT';
    const body = {
      name: userFormData.name
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success('User updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        showError('Failed to update user.');
      }
    } catch (error) {
      showError('Error updating user: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">User Management</h3>
          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm">
            {filteredUsers.length} users
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCleanupDuplicates}
            disabled={loading}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
            title="Remove duplicate user accounts"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Cleanup Duplicates</span>
          </button>
          
          <button
            onClick={handleClearExpiredBans}
            disabled={loading}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
            title="Clear expired user bans"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Clear Expired Bans</span>
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-300">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('email')}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-1"
              >
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </button>
              <button
                onClick={() => handleBulkAction('ban')}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center space-x-1"
              >
                <Ban className="h-4 w-4" />
                <span>Ban</span>
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 border-b border-gray-600">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-gray-600 border-gray-500 text-orange-500"
                  />
                </th>
                <th className="p-4 text-left text-white font-medium">User</th>
                <th className="p-4 text-left text-white font-medium">Status</th>
                <th className="p-4 text-left text-white font-medium">Bookings</th>
                <th className="p-4 text-left text-white font-medium">Last Active</th>
                <th className="p-4 text-left text-white font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded bg-gray-600 border-gray-500 text-orange-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.name || 'Unnamed User'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          user.banned 
                            ? 'bg-red-900/30 text-red-300 border border-red-700'
                            : 'bg-green-900/30 text-green-300 border border-green-700'
                        }`}>
                          {user.banned ? 'Banned' : 'Active'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          user.email_confirmed 
                            ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                            : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                        }`}>
                          {user.email_confirmed ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {user.total_bookings || 0}
                      </div>
                      <div className="text-gray-400 text-sm">
                        ${(user.total_spent || 0).toFixed(2)} spent
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendEmail(user.id, user.name, user.email)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Send email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        {!user.banned ? (
                          <button
                            onClick={() => handleBanUser(user.id, user.name, user.email)}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded-lg transition-colors"
                            title="Ban user"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnbanUser(user.id, user.name, user.email)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Unban user"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name, user.email)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">User Name</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;
