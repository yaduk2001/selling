'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  MessageSquare,
  User,
  Edit3,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminReviews() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { success, error: showError, warning, info, showConfirm } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [newReview, setNewReview] = useState({
    name: '',
    content: '',
    rating: 5,
    position: '',
    company: '',
    image_url: '',
    is_featured: false,
    is_visible: true
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  // Load reviews data
  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.name || !newReview.content) {
      warning('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });

      if (response.ok) {
        loadReviews(); // Refresh data
        setShowAddModal(false);
        resetNewReview();
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const handleUpdateReview = async (reviewId, updatedData) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        loadReviews(); // Refresh data
        setEditingReview(null);
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this review?',
      {
        title: 'Delete Review',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadReviews(); // Refresh data
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const toggleVisibility = async (reviewId, currentVisibility) => {
    await handleUpdateReview(reviewId, { is_visible: !currentVisibility });
  };

  const toggleFeatured = async (reviewId, currentFeatured) => {
    await handleUpdateReview(reviewId, { is_featured: !currentFeatured });
  };

  const resetNewReview = () => {
    setNewReview({
      name: '',
      content: '',
      rating: 5,
      position: '',
      company: '',
      image_url: '',
      is_featured: false,
      is_visible: true
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
                <p className="text-sm text-gray-500">Manage customer testimonials and reviews</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Review</span>
          </button>
        </div>

        {/* Reviews List */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {(() => {
                        // Use local client photos first, then image_url, then fallback
                        const clientPhotos = {
                          'Lauryn Cassells': '/lc.jpeg',
                          'Garvit Chaudhary': '/gc.jpeg',
                          'Akshay Sharma': '/as.jpeg'
                        };
                        const localPhoto = clientPhotos[review.name];
                        const photoUrl = localPhoto || review.image_url;
                        
                        return photoUrl ? (
                          <img src={photoUrl} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{review.name}</h3>
                      {review.position && review.company && (
                        <p className="text-sm text-gray-500">{review.position} at {review.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleVisibility(review.id, review.is_visible)}
                      className={`p-1 rounded ${review.is_visible ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                      title={review.is_visible ? 'Hide review' : 'Show review'}
                    >
                      {review.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => toggleFeatured(review.id, review.is_featured)}
                      className={`p-1 rounded ${review.is_featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-gray-600'}`}
                      title={review.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star className={`h-4 w-4 ${review.is_featured ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center space-x-1 mb-2">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3">{review.content}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    {review.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      review.is_visible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {review.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingData && reviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found. Add your first review!</p>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Review</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Content *</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Write the review content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={newReview.position}
                    onChange={(e) => setNewReview({ ...newReview, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newReview.company}
                    onChange={(e) => setNewReview({ ...newReview, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={newReview.image_url}
                  onChange={(e) => setNewReview({ ...newReview, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={newReview.is_featured}
                    onChange={(e) => setNewReview({ ...newReview, is_featured: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700">Mark as featured</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={newReview.is_visible}
                    onChange={(e) => setNewReview({ ...newReview, is_visible: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="visible" className="text-sm text-gray-700">Make visible on website</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReview}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Add Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Review</h3>
              <button
                onClick={() => setEditingReview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Content *</label>
                <textarea
                  value={editingReview.content}
                  onChange={(e) => setEditingReview({ ...editingReview, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={editingReview.rating}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={editingReview.position || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editingReview.company || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingReview.image_url || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={editingReview.is_featured || false}
                    onChange={(e) => setEditingReview({ ...editingReview, is_featured: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="edit-featured" className="text-sm text-gray-700">Mark as featured</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-visible"
                    checked={editingReview.is_visible !== false}
                    onChange={(e) => setEditingReview({ ...editingReview, is_visible: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="edit-visible" className="text-sm text-gray-700">Make visible on website</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateReview(editingReview.id, editingReview)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Update Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
