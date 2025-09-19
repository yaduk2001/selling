// FILE: src/app/components/home/Pricing.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, Star } from 'lucide-react';
import BookingModal from '../BookingModal';

export default function Pricing({ products, onPurchaseNow }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const router = useRouter();

  const formatPrice = (cents) => `$${(cents / 100).toFixed(0)}`;

  const getProductIcon = (type) => {
    const iconProps = { size: 40, className: "mx-auto text-yellow-500 dark:text-yellow-400" };
    switch (type) {
      case 'pdf': return <FileText {...iconProps} />;
      case 'coaching_individual':
      case 'coaching_team': return <Calendar {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getProductButtonText = (type) => {
    if (type === 'pdf') {
      return [
        { text: '📄 Re-Download PDF', primary: false },
        { text: 'Purchase Now →', primary: true }
      ];
    }
    return [{ text: '📅 Book Coaching Session', primary: true }];
  };

  const handleProductAction = (product, isPrimary) => {
    if (product.type === 'coaching_individual' || product.type === 'coaching_team') {
      if (isPrimary) {
        setSelectedProduct(product);
        setShowBookingModal(true);
      }
    } else if (product.type === 'pdf') {
      if (isPrimary) {
        // Primary button = Purchase Now
        onPurchaseNow(product);
      } else {
        // Non-primary button = Re-Download PDF
        router.push('/download');
      }
    } else {
      // For other product types, use the regular purchase flow
      onPurchaseNow(product);
    }
  };

  return (
    <section id="services" className="section-padding bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="content-container container-padding">
        <h2 className="text-section font-heading text-center mb-8">Pricing Plans</h2>
        
        {products.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No pricing plans available at the moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.id} 
                className={`card-ui ${product.is_popular ? 'card-popular-ui' : ''} relative`}
              >
                {product.is_popular && (
                  <div className="popular-badge-ui">Popular</div>
                )}
                
                <div className="text-center p-6">
                  <div className="mb-4">
                    {getProductIcon(product.type)}
                  </div>
                  <h3 className="font-heading font-semibold text-2xl mb-2 text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <div className="text-4xl font-bold text-blue-600 dark:text-yellow-400 mb-4">
                    {formatPrice(product.price)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[48px]">
                    {product.description}
                  </p>
                  
                  <ul className="text-sm space-y-3 mb-8 text-left text-gray-600 dark:text-gray-300">
                    {(() => {
                      // Handle different feature formats: array, string, or empty
                      let features = [];
                      if (Array.isArray(product.features)) {
                        features = product.features;
                      } else if (typeof product.features === 'string' && product.features.trim()) {
                        features = product.features.split(',').map(f => f.trim()).filter(f => f);
                      }
                      
                      return features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Star size={16} className="mr-2 mt-1 text-blue-600 dark:text-yellow-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ));
                    })()}
                  </ul>
                  
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <strong>No account required!</strong> Purchase now, create password after payment
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {getProductButtonText(product.type).map((button, index) => (
                      <button 
                        key={index}
                        onClick={() => handleProductAction(product, button.primary)}
                        className={`w-full text-button ${button.primary ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          product={selectedProduct}
          onBookingComplete={(bookingData) => {
            setShowBookingModal(false);
            // Handle successful booking if needed
            console.log('Booking completed:', bookingData);
          }}
        />
      </div>
    </section>
  );
}
