'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, User, CreditCard, Download } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      icon: <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-yellow-400" />,
      question: "Do I need to create an account to purchase?",
      answer: "No! You can purchase any product immediately without creating an account. Simply click 'Buy Now' and complete your payment through Stripe. After your successful purchase, you'll be guided to create an account using the email from your purchase."
    },
    {
      icon: <User className="w-5 h-5 text-blue-600 dark:text-yellow-400" />,
      question: "How does the account creation work after purchase?",
      answer: "After completing your payment, you'll be redirected to a simple account setup page where you can set a password for your account. Your email address will be pre-filled from your purchase, and you'll get immediate access to your products and dashboard."
    },
    {
      icon: <CreditCard className="w-5 h-5 text-blue-600 dark:text-yellow-400" />,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing. Your payment information is encrypted and never stored on our servers."
    },
    {
      icon: <Download className="w-5 h-5 text-blue-600 dark:text-yellow-400" />,
      question: "How do I access my purchased products?",
      answer: "For PDF products: Download starts automatically after purchase, and you can re-download from your dashboard. For coaching sessions: You'll receive booking confirmation and can manage your appointments in your dashboard."
    },
    {
      question: "What if I already have an account?",
      answer: "If you're already logged in, the purchase process is even faster! Your email will be pre-filled at checkout, and your purchase will be automatically added to your existing dashboard."
    },
    {
      question: "Is my payment and personal information secure?",
      answer: "Absolutely! We use Stripe for payment processing, which is trusted by millions of businesses worldwide. All payments are encrypted with bank-level security, and we never store your payment information."
    },
    {
      question: "Can I access my purchases on multiple devices?",
      answer: "Yes! Once you create your account, you can log in from any device to access your purchased products, download PDFs, and manage your coaching sessions."
    },
    {
      question: "What happens if I forget my password?",
      answer: "No worries! You can use the 'Forgot Password' link on the login page to reset your password. We'll send a secure reset link to the email address associated with your account."
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Everything you need to know about our purchase process and account creation
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex items-center space-x-3">
                  {faq.icon}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </h3>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <div className="pl-8">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Purchase any product instantly - no registration required!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Instant Purchase
              </span>
              <span className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                Secure Payment
              </span>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                Easy Account Setup
              </span>
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Immediate Access
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
