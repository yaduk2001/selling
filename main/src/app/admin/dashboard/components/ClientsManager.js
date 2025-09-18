'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';

export default function ClientsManager({ user }) {
  const { success, error: showError } = useToast();
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    id: null,
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
    try {
      // Fetch bookings to extract client data
      const response = await fetch('/api/admin/supabase-bookings');
      if (response.ok) {
        const data = await response.json();
        const allBookings = data.bookings || [];
        
        // Group bookings by client email to create client list
        const clientMap = new Map();
        
        allBookings.forEach(booking => {
          const clientEmail = booking.customer_email || booking.email;
          const clientName = booking.customer_name || booking.name;
          
          if (clientEmail) {
            if (clientMap.has(clientEmail)) {
              const existingClient = clientMap.get(clientEmail);
              existingClient.bookings.push(booking);
              existingClient.totalSpent += booking.amount || 0;
              existingClient.lastBooking = new Date(Math.max(
                new Date(existingClient.lastBooking),
                new Date(booking.created_at || booking.booking_date)
              ));
            } else {
              clientMap.set(clientEmail, {
                id: clientEmail,
                name: clientName || clientEmail.split('@')[0],
                email: clientEmail,
                bookings: [booking],
                totalSpent: booking.amount || 0,
                firstBooking: new Date(booking.created_at || booking.booking_date),
                lastBooking: new Date(booking.created_at || booking.booking_date),
                status: booking.status || 'active'
              });
            }
          }
        });
        
        const clientsList = Array.from(clientMap.values()).sort((a, b) => 
          new Date(b.lastBooking) - new Date(a.lastBooking)
        );
        
        setClients(clientsList);
        setBookings(allBookings);
      }
    } catch (error) {
      console.error('Error fetching clients data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };

  const handleEditClient = (client) => {
    setClientFormData(client);
    setShowEditModal(true);
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    const url = `/api/admin/clients/${clientFormData.email}`;
    const method = 'PUT';
    const body = {
      name: clientFormData.name
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success('Client updated successfully!');
        setShowEditModal(false);
        fetchClientsData();
      } else {
        showError('Failed to update client.');
      }
    } catch (error) {
      showError('Error updating client: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Clients Management</h2>
        <div className="text-sm text-text-secondary">
          {clients.length} total clients
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 mr-4">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Clients</p>
              <p className="text-text-primary text-2xl font-bold">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-background p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 mr-4">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Revenue</p>
              <p className="text-text-primary text-2xl font-bold">
                {formatCurrency(clients.reduce((sum, client) => sum + client.totalSpent, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 mr-4">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Avg. per Client</p>
              <p className="text-text-primary text-2xl font-bold">
                {clients.length > 0 
                  ? formatCurrency(clients.reduce((sum, client) => sum + client.totalSpent, 0) / clients.length)
                  : '$0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Client</th>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Bookings</th>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Total Spent</th>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Last Booking</th>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Status</th>
                <th className="px-6 py-3 text-left text-text-primary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id} className="border-t border-border hover:bg-surface/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-text-primary">{client.name}</div>
                        <div className="text-sm text-text-secondary">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-primary">
                      {client.bookings.length}
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">
                      {formatCurrency(client.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {formatDate(client.lastBooking)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEditClient(client)}
                        className="text-blue-500 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-secondary">
                    No clients found. Clients will appear here after they make their first booking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-text-primary">Client Details</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-text-secondary hover:text-text-primary text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-text-primary">{selectedClient.name}</h4>
                <p className="text-text-secondary">{selectedClient.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Total Bookings</p>
                  <p className="font-semibold text-text-primary">{selectedClient.bookings.length}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Spent</p>
                  <p className="font-semibold text-text-primary">{formatCurrency(selectedClient.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">First Booking</p>
                  <p className="font-semibold text-text-primary">{formatDate(selectedClient.firstBooking)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Last Booking</p>
                  <p className="font-semibold text-text-primary">{formatDate(selectedClient.lastBooking)}</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-text-primary mb-2">Booking History</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedClient.bookings.map((booking, index) => (
                    <div key={index} className="p-3 bg-surface rounded border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {booking.service_name || 'Service'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(booking.created_at || booking.booking_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-text-primary">
                            {formatCurrency(booking.amount || 0)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            booking.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Edit Client</h3>
            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="w-full p-2 bg-surface border border-border rounded-md text-text-primary"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:opacity-90"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:opacity-90"
                >
                  Update Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
