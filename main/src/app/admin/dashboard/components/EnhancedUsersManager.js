import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { 
  Users, Mail, Trash2, Eye, EyeOff, Search, Filter, MoreVertical, 
  Ban, UserX, Edit, Save, X, Calendar, DollarSign, CheckCircle, 
  XCircle, Clock, Send, User, Phone, MapPin
} from 'lucide-react';

const EnhancedUsersManager = () => {
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showActions, setShowActions] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserEditor, setShowUserEditor] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchBookings();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      const result = await response.json();
      if (result.success) {
        setBookings(result.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUserEditor = (user) => {
    setSelectedUser(user);
    setEditingUser({ ...user });
    setShowUserEditor(true);
  };

  const closeUserEditor = () => {
    setSelectedUser(null);
    setEditingUser(null);
    setShowUserEditor(false);
  };

  const saveUserChanges = async () => {
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone || '',
          address: editingUser.address || ''
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        closeUserEditor();
        success('User updated successfully!');
      } else {
        showError('Failed to update user: ' + result.error);
      }
    } catch (error) {
      showError('Error updating user: ' + error.message);
    }
  };

  const getUserBookings = (userEmail) => {
    return bookings.filter(booking => 
      booking.email === userEmail || 
      booking.customer_email === userEmail
    );
  };

  const handleBookingAction = async (bookingId, action, sendEmail = false) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const actionText = {
      confirm: 'confirm',
      reject: 'reject', 
      cancel: 'cancel'
    };

    const confirmMessage = `${actionText[action].toUpperCase()} booking for "${booking.products?.name || 'Service'}"?${sendEmail ? '\n\nAn email will be sent to the customer.' : ''}`;
    
    const confirmed = await showConfirm(confirmMessage, {
      title: `${actionText[action]} Booking`,
      confirmText: actionText[action],
      variant: action === 'cancel' ? 'destructive' : 'default'
    });
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          status: action === 'confirm' ? 'confirmed' : action === 'reject' ? 'rejected' : 'cancelled',
          sendEmail,
          customerName: booking.name || booking.customer_name,
          customerEmail: booking.email || booking.customer_email
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchBookings();
        success(`Booking ${action}ed successfully!${sendEmail ? ' Email sent.' : ''}`);
      } else {
        showError(`Failed to ${action} booking: ` + result.error);
      }
    } catch (error) {
      showError(`Error ${action}ing booking: ` + error.message);
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail, sendEmail = true) => {
    const confirmed = await showConfirm(
      `⚠️ DELETE USER: ${userName} (${userEmail})\n\nThis will permanently:\n• Delete their account\n• Cancel all their bookings\n• Remove all their data\n\n${sendEmail ? 'A notification email will be sent.\n\n' : ''}This action CANNOT be undone!`,
      {
        title: 'Delete User',
        confirmText: 'Delete',
        variant: 'destructive'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}&sendEmail=${sendEmail}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        await fetchBookings();
        success(`User "${userName}" deleted successfully.${sendEmail ? ' Notification email sent.' : ''}`);
        if (selectedUser?.id === userId) {
          closeUserEditor();
        }
      } else {
        showError('Failed to delete user: ' + result.error);
      }
    } catch (error) {
      showError('Error deleting user: ' + error.message);
    }
  };

  const handleBanUser = async (userId, userName, duration = '7days', sendEmail = true) => {
    const confirmed = await showConfirm(
      `🚫 BAN USER: ${userName}\n\nDuration: ${duration}\n${sendEmail ? 'A notification email will be sent.\n\n' : ''}Continue?`,
      {
        title: 'Ban User',
        confirmText: 'Ban',
        variant: 'destructive'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'ban',
          duration,
          sendEmail
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchUsers();
        success(`User "${userName}" banned successfully.${sendEmail ? ' Notification email sent.' : ''}`);
      } else {
        showError('Failed to ban user: ' + result.error);
      }
    } catch (error) {
      showError('Error banning user: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'banned' && user.banned) ||
                         (filterStatus === 'active' && !user.banned);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-white">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Enhanced User Management</h3>
          </div>
          <div className="text-sm text-gray-300">
            {filteredUsers.length} users
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-3 text-gray-300 font-medium">User</th>
                <th className="pb-3 text-gray-300 font-medium">Email</th>
                <th className="pb-3 text-gray-300 font-medium">Status</th>
                <th className="pb-3 text-gray-300 font-medium">Bookings</th>
                <th className="pb-3 text-gray-300 font-medium">Total Spent</th>
                <th className="pb-3 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userBookings = getUserBookings(user.email);
                return (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {(user.name || user.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name || 'No Name'}</div>
                          <div className="text-sm text-gray-400">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{user.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.banned 
                          ? 'bg-red-900 text-red-200' 
                          : 'bg-green-900 text-green-200'
                      }`}>
                        {user.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">{userBookings.length}</td>
                    <td className="py-4 text-gray-300">${user.total_spent?.toFixed(2) || '0.00'}</td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUserEditor(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id, user.name || user.email)}
                          className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded"
                          title="Ban User"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name || user.email, user.email)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No users found matching your search criteria.
            </div>
          )}
        </div>
      </div>

      {/* User Editor Modal */}
      {showUserEditor && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-orange-400" />
                <h3 className="text-xl font-semibold text-white">Edit User: {selectedUser.name || selectedUser.email}</h3>
              </div>
              <button
                onClick={closeUserEditor}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Details */}
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-lg font-medium text-white mb-4">User Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={editingUser?.name || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={editingUser?.email || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editingUser?.phone || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                      <textarea
                        value={editingUser?.address || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        placeholder="Address"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveUserChanges}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name || selectedUser.email, selectedUser.email, true)}
                      className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete User</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* User Bookings */}
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-lg font-medium text-white mb-4">User Bookings ({getUserBookings(selectedUser.email).length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getUserBookings(selectedUser.email).map((booking) => (
                      <div key={booking.id} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-white">
                              {booking.products?.name || 'Service'}
                            </div>
                            <div className="text-sm text-gray-300">
                              {booking.name || booking.customer_name || 'No Name'} • {booking.email || booking.customer_email}
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(booking.booking_date || booking.created_at).toLocaleDateString()} 
                              {booking.booking_time && ` at ${booking.booking_time}`}
                            </div>
                            {booking.transactions && (
                              <div className="text-sm text-green-400">
                                ${(booking.transactions.amount / 100).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-900 text-green-200' :
                            booking.status === 'rejected' ? 'bg-red-900 text-red-200' :
                            booking.status === 'cancelled' ? 'bg-gray-900 text-gray-200' :
                            'bg-yellow-900 text-yellow-200'
                          }`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                        
                        {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleBookingAction(booking.id, 'confirm', true)}
                              className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.id, 'reject', true)}
                              className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.id, 'cancel', true)}
                              className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {getUserBookings(selectedUser.email).length === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        No bookings found for this user.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUsersManager;
