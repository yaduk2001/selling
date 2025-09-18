// FILE: app/page.js
// SELLING INFINITY - Main Landing Page (Original Design Restored)
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import Header from './components/home/Header';
import Hero from './components/home/Hero';
import About from './components/home/About';
import Pricing from './components/home/Pricing';
import Testimonials from './components/home/Testimonials';
import Footer from './components/home/Footer';
import FAQ from './components/home/FAQ';

export default function HomePage() {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/get-content');
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setTestimonials(data.testimonials || []);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handlePurchase = async (product) => {
    try {
      // Show loading toast
      info('Creating checkout session...');

      // Allow purchase without login - we'll create account after payment
      const requestData = {
        productId: product.id,
        customerEmail: user?.email || null, // Optional email if logged in
        createAccountAfterPurchase: !user // Flag to indicate account creation needed
      };

      // If it's a coaching session, we'll handle time slot selection in the checkout flow
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      showError(error.message || 'Failed to start checkout process');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Pricing Section */}
        <Pricing products={products} onPurchaseNow={handlePurchase} />
        
        {/* About Section */}
        <About />
        
        {/* Testimonials Section */}
        <Testimonials testimonials={testimonials} />
        
        {/* FAQ Section */}
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
}