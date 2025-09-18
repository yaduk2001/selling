'use client';

import React, { useState } from 'react';
import Header from '../components/home/Header';
import Footer from '../components/home/Footer';

const RedownloadPDF = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRedownload = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Check if email has valid purchases and download PDF
      const response = await fetch(`/api/download-pdf?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        // If successful, trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'IMPACT.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage('PDF download started! Check your downloads folder.');
        setIsSuccess(true);
        setEmail(''); // Clear email after successful download
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Download failed. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Something went wrong. Please try again later.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-1 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 mb-6">
            <div className="bg-gray-900 rounded-full px-8 py-3">
              <span className="text-3xl">📥</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Re-download Your PDF
          </h1>
          
          <div className="glassmorphism-card max-w-2xl mx-auto px-6 py-4">
            <p className="text-gray-300 text-lg">
              Enter the email address you used for your purchase to download your PDF again
            </p>
          </div>
        </div>

        {/* Download Form */}
        <div className="max-w-md mx-auto">
          <div className="glassmorphism-card p-8">
            <form onSubmit={handleRedownload} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 hover:scale-105 shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">📥</span>
                    Download PDF
                  </div>
                )}
              </button>
            </form>

            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl text-center ${
                isSuccess 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-xl mr-2">
                    {isSuccess ? '✅' : '❌'}
                  </span>
                </div>
                <p className="font-semibold">{message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="glassmorphism-card p-6 text-center">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
            <p className="text-gray-400 text-sm">
              Your email is verified against our secure purchase database
            </p>
          </div>
          
          <div className="glassmorphism-card p-6 text-center">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant</h3>
            <p className="text-gray-400 text-sm">
              Download starts immediately after verification
            </p>
          </div>
          
          <div className="glassmorphism-card p-6 text-center">
            <div className="text-3xl mb-4">♾️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Unlimited</h3>
            <p className="text-gray-400 text-sm">
              Download as many times as you need
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl text-white hover:bg-gray-600/50 transition-all"
          >
            <span className="mr-2">←</span>
            Back to Home
          </a>
        </div>
      </div>

      <style jsx>{`
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
      `}</style>
      </div>
      <Footer />
    </>
  );
};

export default RedownloadPDF;