'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import { useRouter } from 'next/navigation';
import EmailTemplateManager from './components/EmailTemplateManager';
import BusinessHoursManager from './components/BusinessHoursManager';
import BusySlotsManager from './components/BusySlotsManager';
import ServicesManager from './components/ServicesManager';
import UsersManager from './components/UsersManager';
import EnhancedUsersManager from './components/EnhancedUsersManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faYoutube, 
  faInstagram, 
  faTiktok, 
  faThreads, 
  faTwitter,
  faLinkedin, 
  faFacebook 
} from '@fortawesome/free-brands-svg-icons';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  Plus,
  X,
  Save,
  EyeOff,
  Mail,
  Menu
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      totalRevenue: 0,
      totalUsers: 0,
      pendingBookings: 0
    },
    recentBookings: [],
    recentUsers: []
  });
  const [loadingData, setLoadingData] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    } else if (user) {
      checkAdminAccess();
    }
  }, [user, loading, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/check-admin-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await response.json();
      
      if (!data.success || !data.isAdmin) {
        router.push('/admin/login');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/admin/login');
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/stats');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          console.error('API returned error:', result.error);
          // Keep using mock data if API fails
          setDashboardData({
            stats: {
              totalBookings: 0,
              totalRevenue: 0,
              totalUsers: 0,
              pendingBookings: 0
            },
            recentBookings: [],
            recentUsers: []
          });
        }
      } else {
        console.error('Failed to fetch admin stats:', response.status);
        // Fallback to empty data
        setDashboardData({
          stats: {
            totalBookings: 0,
            totalRevenue: 0,
            totalUsers: 0,
            pendingBookings: 0
          },
          recentBookings: [],
          recentUsers: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to empty data
      setDashboardData({
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          totalUsers: 0,
          pendingBookings: 0
        },
        recentBookings: [],
        recentUsers: []
      });
    }
    setLoadingData(false);
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await fetch('/api/admin/send-session-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' })
      });

      const result = await response.json();
      if (result.success) {
        success(`Session reminders sent: ${result.results.successful} successful, ${result.results.failed} failed`);
      } else {
        showError('Failed to send reminders: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      showError('Error sending reminders: ' + error.message);
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = "yellow" }) => (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs sm:text-sm font-medium">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
        </div>
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-400`} />
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => {
        onClick(id);
        setMobileMenuOpen(false); // Close mobile menu on selection
      }}
      className={`flex items-center justify-center sm:justify-start space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
        active 
          ? 'bg-yellow-400 text-gray-900' 
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      <Icon size={18} />
      <span className="text-xs sm:text-sm">{label}</span>
    </button>
  );

  const BookingsManager = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, confirmed, completed, cancelled
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [bookingFormData, setBookingFormData] = useState({
      id: null,
      customer_name: '',
      customer_email: '',
      booking_date: '',
      booking_time: '',
      duration_minutes: 0,
      status: ''
    });

    useEffect(() => {
      loadBookings();
    }, [filter]);

    const loadBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/bookings');
        const data = await response.json();
        
        if (data.success) {
          let filteredBookings = data.bookings;
          if (filter !== 'all') {
            filteredBookings = data.bookings.filter(booking => booking.status === filter);
          }
          setBookings(filteredBookings);
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
      }
      setLoading(false);
    };

    const updateBookingStatus = async (bookingId, newStatus) => {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'status', status: newStatus, action: newStatus })
        });

        if (response.ok) {
          loadBookings(); // Refresh the list
        }
      } catch (error) {
        console.error('Error updating booking:', error);
      }
    };

    const deleteBooking = async (bookingId) => {
      const confirmed = await showConfirm(
        'Are you sure you want to delete this booking? This action cannot be undone.',
        {
          title: 'Delete Booking',
          confirmText: 'Delete',
          variant: 'danger'
        }
      );
      
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch('/api/admin/bookings', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId })
        });

        if (response.ok) {
          loadBookings(); // Refresh the list
          success('Booking deleted successfully');
        } else {
          showError('Failed to delete booking. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        showError('An error occurred while deleting the booking.');
      }
    };

    const handleEditBooking = (booking) => {
      setBookingFormData(booking);
      setEditingBooking(booking);
      setShowEditModal(true);
    };

    const handleBookingSubmit = async (e) => {
      e.preventDefault();
      const url = `/api/admin/bookings/${editingBooking.id}`;
      const method = 'PUT';
      const body = {
        type: 'details',
        ...bookingFormData
      };

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          success('Booking updated successfully!');
          setShowEditModal(false);
          loadBookings();
        } else {
          showError('Failed to update booking.');
        }
      } catch (error) {
        showError('Error updating booking: ' + error.message);
      }
    };

    const StatusBadge = ({ status }) => {
      const colors = {
        confirmed: 'bg-blue-900 text-blue-300',
        completed: 'bg-green-900 text-green-300',
        cancelled: 'bg-red-900 text-red-300',
        no_show: 'bg-gray-900 text-gray-300'
      };

      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-600 text-gray-300'}`}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      );
    };

    return (
      <div className="space-y-4">
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === key
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-white font-medium">{booking.customer_email}</p>
                        <p className="text-gray-400 text-sm">
                          {booking.products?.name} • {booking.booking_date} at {booking.booking_time}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Duration: {booking.duration_minutes}min • Created: {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={booking.status} />
                    
                    {booking.status === 'confirmed' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Approve booking"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Cancel booking"
                        >
                          <AlertCircle size={18} />
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="Edit booking"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteBooking(booking.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete booking permanently"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-white text-lg font-medium mb-2">No bookings found</h4>
            <p className="text-gray-400">No bookings match your current filter</p>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Booking</h3>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={bookingFormData.customer_name}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, customer_name: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={bookingFormData.customer_email}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, customer_email: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Booking Date</label>
                    <input
                      type="date"
                      value={bookingFormData.booking_date}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, booking_date: e.target.value })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Booking Time</label>
                    <input
                      type="time"
                      value={bookingFormData.booking_time}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, booking_time: e.target.value })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      required
                    />
                  </div>
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
                    Update Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const UsersManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      loadUsers();
    }, []);

    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
      setLoading(false);
    };

    const filteredUsers = users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div className="text-gray-400 text-sm">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 font-medium text-sm">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.full_name || 'No name provided'}
                      </p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <p className="text-gray-500 text-xs">
                        Joined: {new Date(user.created_at).toLocaleDateString()} 
                        {user.bookingCount && (
                          <span className="ml-2">• {user.bookingCount} bookings</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      Active
                    </span>
                    <button
                      className="text-gray-400 hover:text-white p-2"
                      title="View user details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-white text-lg font-medium mb-2">No users found</h4>
            <p className="text-gray-400">
              {searchTerm ? 'No users match your search' : 'No users registered yet'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const ContentManager = () => {
    const [contentTab, setContentTab] = useState('testimonials');
    const [testimonials, setTestimonials] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [newTestimonial, setNewTestimonial] = useState({
      name: '',
      content: '',
      rating: 5,
      position: '',
      company: '',
      image_url: ''
    });

    useEffect(() => {
      loadContent();
    }, [contentTab]);

    const loadContent = async () => {
      setLoading(true);
      try {
        if (contentTab === 'testimonials') {
          const response = await fetch('/api/admin/reviews');
          const data = await response.json();
          console.log('Testimonials API response:', data);
          if (data.success) {
            console.log('Setting testimonials:', data.reviews?.length || 0, 'items');
            setTestimonials(data.reviews);
          }
        }
      } catch (error) {
        console.error('Error loading content:', error);
      }
      setLoading(false);
    };

    const handleAddTestimonial = async () => {
      if (!newTestimonial.name || !newTestimonial.content) {
        warning('Please fill in all required fields');
        return;
      }

      try {
        const response = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTestimonial)
        });

        if (response.ok) {
          loadContent(); // Refresh data
          setShowAddModal(false);
          resetNewTestimonial();
        }
      } catch (error) {
        console.error('Error adding testimonial:', error);
      }
    };

    const handleUpdateTestimonial = async (testimonialId, updatedData) => {
      try {
        const response = await fetch(`/api/admin/reviews/${testimonialId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (response.ok) {
          loadContent(); // Refresh data
          setEditingItem(null);
        }
      } catch (error) {
        console.error('Error updating testimonial:', error);
      }
    };

    const handleDeleteTestimonial = async (testimonialId) => {
      const confirmed = await showConfirm(
        'Are you sure you want to delete this testimonial?',
        {
          title: 'Delete Testimonial',
          confirmText: 'Delete',
          variant: 'danger'
        }
      );
      
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/admin/reviews/${testimonialId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          loadContent(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting testimonial:', error);
      }
    };

    const handleToggleApproval = async (testimonialId, isApproved) => {
      try {
        const response = await fetch(`/api/admin/reviews/${testimonialId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_approved: isApproved })
        });

        if (response.ok) {
          loadContent(); // Refresh data
          success(`Testimonial ${isApproved ? 'approved' : 'disapproved'} successfully`);
        }
      } catch (error) {
        console.error('Error toggling approval:', error);
        showError('Failed to update testimonial approval status');
      }
    };

    const resetNewTestimonial = () => {
      setNewTestimonial({
        name: '',
        content: '',
        rating: 5,
        position: '',
        company: '',
        image_url: ''
      });
    };

    const renderStars = (rating) => {
      return [...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
        />
      ));
    };

    return (
      <div className="space-y-4">
        {/* Content Type Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'testimonials', label: 'Testimonials' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setContentTab(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                contentTab === key
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>


        {/* Testimonials Tab */}
        {contentTab === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-medium">Manage Testimonials</h4>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>Add Testimonial</span>
              </button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : testimonials.length > 0 ? (
              <div className="space-y-3">
                {console.log('Rendering testimonials:', testimonials?.length, testimonials)}
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-white font-medium">{testimonial.customer_name || testimonial.name}</h4>
                          {testimonial.position && testimonial.company && (
                            <span className="text-gray-400 text-sm">
                              {testimonial.position} at {testimonial.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {renderStars(testimonial.rating)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            testimonial.is_approved 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {testimonial.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3 break-words">{testimonial.review_text || testimonial.content}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingItem(testimonial)}
                          className="text-green-400 hover:text-green-300 p-2"
                          title="View testimonial"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingItem(testimonial)}
                          className="text-blue-400 hover:text-blue-300 p-2"
                          title="Edit testimonial"
                        >
                          <Edit size={16} />
                        </button>
                        {testimonial.is_approved ? (
                          <button
                            onClick={() => handleToggleApproval(testimonial.id, false)}
                            className="text-yellow-400 hover:text-yellow-300 p-2"
                            title="Disapprove testimonial"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleApproval(testimonial.id, true)}
                            className="text-green-400 hover:text-green-300 p-2"
                            title="Approve testimonial"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                          title="Delete testimonial"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-white text-lg font-medium mb-2">No testimonials found</h4>
                <p className="text-gray-400">Add your first testimonial to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Add Testimonial Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Add New Testimonial</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Review Content *</label>
                  <textarea
                    value={newTestimonial.content}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                    rows="4"
                    placeholder="Write the testimonial content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rating</label>
                  <select
                    value={newTestimonial.rating}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  >
                    {[5, 4, 3, 2, 1].map(rating => (
                      <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                    <input
                      type="text"
                      value={newTestimonial.position}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, position: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                      placeholder="e.g. CEO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={newTestimonial.company}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTestimonial}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Add Testimonial</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Testimonial Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Edit Testimonial</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Review Content *</label>
                  <textarea
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rating</label>
                  <select
                    value={editingItem.rating}
                    onChange={(e) => setEditingItem({ ...editingItem, rating: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                  >
                    {[5, 4, 3, 2, 1].map(rating => (
                      <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                    <input
                      type="text"
                      value={editingItem.position || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, position: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={editingItem.company || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTestimonial(editingItem.id, editingItem)}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Testimonial</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Testimonial Modal */}
        {viewingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">View Testimonial</h3>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    {viewingItem.image_url ? (
                      <img src={viewingItem.image_url} alt={viewingItem.customer_name || viewingItem.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {(viewingItem.customer_name || viewingItem.name)?.charAt(0) || 'T'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">{viewingItem.customer_name || viewingItem.name}</h4>
                    {viewingItem.position && viewingItem.company && (
                      <p className="text-gray-400 text-sm">{viewingItem.position} at {viewingItem.company}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 mb-3">
                  {renderStars(viewingItem.rating)}
                  <span className="text-yellow-400 ml-2 font-medium">({viewingItem.rating}/5)</span>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{viewingItem.review_text || viewingItem.content}</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SocialMediaManager = () => {
    const [socials, setSocials] = useState({
      youtube: '',
      instagram: '',
      tiktok: '',
      threads: '',
      twitter: '',
      linkedin: '',
      facebook: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState(null);

    useEffect(() => {
      loadSocialLinks();
    }, []);

    const loadSocialLinks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/social-links');
        const data = await response.json();
        
        if (data.success) {
          setSocials(data.socials);
        }
      } catch (error) {
        console.error('Error loading social links:', error);
      }
      setLoading(false);
    };

    const updateSocialLinks = async () => {
      setSaving(true);
      try {
        const response = await fetch('/api/admin/social-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ socials }),
        });

        const data = await response.json();
        
        if (data.success) {
          setSocials(data.socials);
          setEditingPlatform(null);
        }
      } catch (error) {
        console.error('Error updating social links:', error);
      }
      setSaving(false);
    };

    const platforms = [
      { key: 'youtube', name: 'YouTube', icon: <FontAwesomeIcon icon={faYoutube} className="text-red-500" />, color: 'red' },
      { key: 'instagram', name: 'Instagram', icon: <FontAwesomeIcon icon={faInstagram} className="text-pink-500" />, color: 'pink' },
      { key: 'tiktok', name: 'TikTok', icon: <FontAwesomeIcon icon={faTiktok} />, color: 'black' },
      { key: 'threads', name: 'Threads', icon: <FontAwesomeIcon icon={faThreads} />, color: 'purple' },
      { key: 'twitter', name: 'Twitter', icon: <FontAwesomeIcon icon={faTwitter} className="text-blue-400" />, color: 'blue' },
      { key: 'linkedin', name: 'LinkedIn', icon: <FontAwesomeIcon icon={faLinkedin} className="text-blue-600" />, color: 'blue' },
      { key: 'facebook', name: 'Facebook', icon: <FontAwesomeIcon icon={faFacebook} className="text-blue-600" />, color: 'blue' }
    ];
    
    return (
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {platforms.map((platform) => (
              <div key={platform.key} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="text-2xl">{platform.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{platform.name}</h4>
                      {editingPlatform === platform.key ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="url"
                            value={socials[platform.key]}
                            onChange={(e) => setSocials({...socials, [platform.key]: e.target.value})}
                            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-yellow-400 focus:outline-none"
                            placeholder={`https://${platform.name.toLowerCase()}.com/...`}
                          />
                          <button
                            onClick={updateSocialLinks}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingPlatform(null)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : socials[platform.key] ? (
                        <a 
                          href={socials[platform.key]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm block mt-1"
                        >
                          {socials[platform.key]}
                        </a>
                      ) : (
                        <p className="text-gray-400 text-sm mt-1">Not configured</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {socials[platform.key] && (
                      <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => setEditingPlatform(platform.key)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="Edit URL"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h5 className="text-blue-300 font-medium">Social Media Links</h5>
              <p className="text-blue-200 text-sm mt-1">
                These are your current social media profiles. They appear in the website footer and other places throughout the site.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-gray-400 text-sm sm:text-base hidden sm:block">Welcome, {user.email}</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm sm:px-4 sm:text-base rounded-lg transition-colors"
            >
              Back to Site
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        {/* Desktop Navigation */}
        <div className="hidden sm:block px-6 py-4">
          <nav className="flex space-x-2 lg:space-x-4 overflow-x-auto">
            <TabButton
              id="overview"
              label="Overview"
              icon={TrendingUp}
              active={activeTab === 'overview'}
              onClick={setActiveTab}
            />
            <TabButton
              id="bookings"
              label="Bookings"
              icon={Calendar}
              active={activeTab === 'bookings'}
              onClick={setActiveTab}
            />
            <TabButton
              id="content"
              label="Content"
              icon={FileText}
              active={activeTab === 'content'}
              onClick={setActiveTab}
            />
            <TabButton
              id="availability"
              label="Availability"
              icon={Clock}
              active={activeTab === 'availability'}
              onClick={setActiveTab}
            />
            <TabButton
              id="settings"
              label="Settings"
              icon={Settings}
              active={activeTab === 'settings'}
              onClick={setActiveTab}
            />
            <TabButton
              id="social"
              label="Social Media"
              icon={Users}
              active={activeTab === 'social'}
              onClick={setActiveTab}
            />
          </nav>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 py-4 border-t border-gray-700">
            <nav className="grid grid-cols-2 gap-2">
              <TabButton
                id="overview"
                label="Overview"
                icon={TrendingUp}
                active={activeTab === 'overview'}
                onClick={setActiveTab}
              />
              <TabButton
                id="bookings"
                label="Bookings"
                icon={Calendar}
                active={activeTab === 'bookings'}
                onClick={setActiveTab}
              />
              <TabButton
                id="users"
                label="Users"
                icon={Users}
                active={activeTab === 'users'}
                onClick={setActiveTab}
              />
              <TabButton
                id="content"
                label="Content"
                icon={FileText}
                active={activeTab === 'content'}
                onClick={setActiveTab}
              />
              <TabButton
                id="emails"
                label="Email"
                icon={Mail}
                active={activeTab === 'emails'}
                onClick={setActiveTab}
              />
              <TabButton
                id="availability"
                label="Calendar"
                icon={Clock}
                active={activeTab === 'availability'}
                onClick={setActiveTab}
              />
              <TabButton
                id="social"
                label="Social"
                icon={Users}
                active={activeTab === 'social'}
                onClick={setActiveTab}
              />
              <TabButton
                id="settings"
                label="Settings"
                icon={Settings}
                active={activeTab === 'settings'}
                onClick={setActiveTab}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Bookings"
                value={loadingData ? '...' : dashboardData.stats.totalBookings}
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Total Revenue"
                value={loadingData ? '...' : `$${dashboardData.stats.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Total Users"
                value={loadingData ? '...' : dashboardData.stats.totalUsers}
                icon={Users}
                color="purple"
              />
              <StatCard
                title="Pending Bookings"
                value={loadingData ? '...' : dashboardData.stats.pendingBookings}
                icon={Clock}
                color="yellow"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  {loadingData ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
                      ))}
                    </div>
                  ) : dashboardData.recentBookings.length > 0 ? (
                    dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{booking.customerName}</p>
                          <p className="text-gray-400 text-sm">{booking.customerEmail}</p>
                          <p className="text-gray-400 text-xs">{booking.bookingDate} at {booking.bookingTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">${booking.amount}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'confirmed' ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : (
                              <Clock size={12} className="mr-1" />
                            )}
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">No recent bookings</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {loadingData ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
                      ))}
                    </div>
                  ) : dashboardData.recentUsers.length > 0 ? (
                    dashboardData.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-semibold">
                            {user.totalBookings} {user.totalBookings === 1 ? 'booking' : 'bookings'}
                          </p>
                          <p className="text-gray-400 text-xs">Joined {user.joinedAt}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">No recent users</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Manage Bookings</h3>
                  <p className="text-gray-400 mt-1">View and manage all customer bookings</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => loadDashboardData()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <BookingsManager />
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Content Management</h3>
                  <p className="text-gray-400 mt-1">Manage website content, testimonials, and products</p>
                </div>
                <button 
                  onClick={() => loadDashboardData()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              <ContentManager />
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Availability Management</h3>
              <p className="text-gray-400 mt-1">Manage your calendar, busy slots, business hours, and availability</p>
            </div>
            <div className="p-6 space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="h-8 w-8 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium">Full Calendar View</h4>
                      <p className="text-gray-400 text-sm">Access the complete calendar management interface</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/admin/calendar')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Open Full Calendar</span>
                  </button>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-8 w-8 text-green-400" />
                    <div>
                      <h4 className="text-white font-medium">Business Hours</h4>
                      <p className="text-gray-400 text-sm">Set your working hours and breaks</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    Configure when you're available for bookings
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-8 w-8 text-orange-400" />
                    <div>
                      <h4 className="text-white font-medium">Busy Slots</h4>
                      <p className="text-gray-400 text-sm">Block specific time periods</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    Mark unavailable times and send notifications
                  </div>
                </div>
              </div>

              {/* Busy Slots Manager */}
              <BusySlotsManager />

              {/* Email Notifications Section */}
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Mail className="h-8 w-8 text-purple-400" />
                  <div>
                    <h4 className="text-white font-medium">Session Reminders</h4>
                    <p className="text-gray-400 text-sm">Send email reminders for upcoming sessions</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleSendReminders}
                    disabled={sendingReminders}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    {sendingReminders ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Send Tomorrow's Reminders</span>
                      </>
                    )}
                  </button>
                  <div className="text-sm text-gray-300">
                    Automatically sends 24-hour reminders to customers with sessions tomorrow
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Social Media Management</h3>
                  <p className="text-gray-400 mt-1">Manage your social media links and profiles</p>
                </div>
                <button 
                  onClick={() => loadDashboardData()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              <SocialMediaManager />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Services Management</h3>
                <p className="text-gray-400 mt-1">Manage the services you offer</p>
              </div>
              <div className="p-6">
                <ServicesManager />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Business Hours Management</h3>
                <p className="text-gray-400 mt-1">Set your availability and breaks</p>
              </div>
              <div className="p-6">
                <BusinessHoursManager />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Email Template Management</h3>
                <p className="text-gray-400 mt-1">Create and manage email templates for client communications</p>
              </div>
              <div className="p-6">
                <EmailTemplateManager />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <p className="text-gray-400 mt-1">View and manage user accounts</p>
              </div>
              <div className="p-6">
                <EnhancedUsersManager />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
