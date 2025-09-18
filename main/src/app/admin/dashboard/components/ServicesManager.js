'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';

export default function ServicesManager({ user }) {
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    is_active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/supabase-services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingService 
        ? '/api/admin/supabase-services'
        : '/api/admin/supabase-services';
      
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService 
        ? { id: editingService.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchServices();
        setShowForm(false);
        setEditingService(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || '',
      is_active: service.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this service?',
      {
        title: 'Delete Service',
        confirmText: 'Delete',
        variant: 'destructive'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/supabase-services?id=${serviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
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
        <h2 className="text-2xl font-bold text-text-primary">Services Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingService(null);
            setFormData({
              name: '',
              description: '',
              price: '',
              duration: '',
              is_active: true
            });
          }}
          className="bg-primary text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          Add New Service
        </button>
      </div>

      {showForm && (
        <div className="bg-background p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-primary font-medium mb-2">Service Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary h-24"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-3 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-text-primary font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full p-3 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-text-primary">Service is active</label>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingService(null);
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left text-text-primary font-medium">Name</th>
              <th className="px-6 py-3 text-left text-text-primary font-medium">Price</th>
              <th className="px-6 py-3 text-left text-text-primary font-medium">Duration</th>
              <th className="px-6 py-3 text-left text-text-primary font-medium">Status</th>
              <th className="px-6 py-3 text-left text-text-primary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map((service) => (
                <tr key={service.id} className="border-t border-border">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text-primary">{service.name}</div>
                      <div className="text-sm text-text-secondary">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-primary">${service.price}</td>
                  <td className="px-6 py-4 text-text-primary">{service.duration} min</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">
                  No services found. Create your first service to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
