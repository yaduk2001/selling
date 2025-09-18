// FILE: app/components/Hero.js

import React from 'react';
import { ShoppingCart, CreditCard, User, Zap } from 'lucide-react';

const Hero = () => (
    <>
        <section className="bg-gray-800 relative pt-20 pb-32 sm:pt-28 sm:pb-40">
            <div className="container mx-auto px-6 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-400">
                    Generated $20 million in sales.
                </h1>
                <h2 className="mt-8 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-100 max-w-4xl mx-auto">
                    Training sales reps to make millions a year. Getting that promotion and new high-paying clients is easy.
                </h2>
                <h3 className="mt-8 text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-gray-100 max-w-4xl mx-auto">
                    FASTEST way to earn freedom NOW
                </h3>
            </div>
            <div className="hero-wave">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[150px]">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31.74,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
                </svg>
            </div>
        </section>

        {/* Purchase Process Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Start Learning Today - No Registration Required!
                    </h3>
                    <p className="text-blue-100 text-lg">
                        Purchase instantly and create your account after payment
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white mb-2">1. Click Buy Now</h4>
                        <p className="text-blue-100 text-sm">Choose any product and purchase immediately</p>
                    </div>
                    
                    <div className="text-center">
                        <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white mb-2">2. Secure Payment</h4>
                        <p className="text-blue-100 text-sm">Complete payment with Stripe's secure checkout</p>
                    </div>
                    
                    <div className="text-center">
                        <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white mb-2">3. Create Account</h4>
                        <p className="text-blue-100 text-sm">Set your password using purchase email</p>
                    </div>
                    
                    <div className="text-center">
                        <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white mb-2">4. Access Content</h4>
                        <p className="text-blue-100 text-sm">Download PDFs or book coaching sessions</p>
                    </div>
                </div>
                
                <div className="text-center mt-6">
                    <p className="text-blue-100 text-sm">
                        ✨ Already have an account? You'll skip step 3 and go straight to your dashboard!
                    </p>
                </div>
            </div>
        </section>
    </>
);

export default Hero;