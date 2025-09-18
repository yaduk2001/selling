// FILE: app/page.js
// SELLING INFINITY - Main Landing Page (Original Design Restored)
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Header from './components/home/Header';
import Hero from './components/home/Hero';
import Pricing from './components/home/Pricing';
import Testimonials from './components/home/Testimonials';
import Footer from './components/home/Footer';
import FAQ from './components/home/FAQ';

export default function HomePage() {
  const { user } = useAuth();
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
        <Pricing products={products} />
        
        {/* Testimonials Section */}
        <Testimonials testimonials={testimonials} />
        
        {/* FAQ Section */}
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
}
