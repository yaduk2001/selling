'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '../components/home/Footer';

const Spinner = () => (
    <div className="border-t-transparent border-solid animate-spin rounded-full border-orange-400 border-4 h-12 w-12"></div>
);

export default function SuccessContent() {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Finalizing your purchase, please wait...');
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [productType, setProductType] = useState(null);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id'); // Stripe session ID
    const transactionId = searchParams.get('transaction_id'); // Legacy PayPal transaction ID
    const setupAccount = searchParams.get('setup_account'); // Flag for account setup

    useEffect(() => {
        if (!sessionId && !transactionId) {
            setStatus('error');
            setMessage('No payment session found. If you have completed a purchase, please check your confirmation email for details.');
            return;
        }

        // If user needs to set up account, redirect immediately (but first get booking token)
        if (setupAccount === 'true') {
            // Try to get booking token from payment callback first
            const getBookingTokenAndRedirect = async () => {
                try {
                    const callbackResponse = await fetch('/api/payment-callback', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId
                        })
                    });
                    
                    const callbackResult = await callbackResponse.json();
                    console.log('Payment callback result for account setup:', callbackResult);
                    
                    const bookingToken = callbackResult.bookingToken;
                    const redirectUrl = bookingToken 
                        ? `/account-setup?session_id=${sessionId}&booking_token=${bookingToken}`
                        : `/account-setup?session_id=${sessionId}`;
                    
                    router.push(redirectUrl);
                } catch (error) {
                    console.error('Error getting booking token:', error);
                    // Fallback to basic redirect
                    router.push(`/account-setup?session_id=${sessionId}`);
                }
            };
            
            getBookingTokenAndRedirect();
            return;
        }

        const processTransaction = async () => {
            try {
                let response;
                let userId = null;
                let userEmail = null;

                // Get user info if available (for booking confirmation)
                if (typeof window !== 'undefined') {
                    const userSession = localStorage.getItem('userSession');
                    if (userSession) {
                        const user = JSON.parse(userSession);
                        userId = user.id;
                        userEmail = user.email;
                    }
                }
                
                if (sessionId) {
                    // Handle Stripe session
                    response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
                    
                    // Also trigger payment callback to confirm bookings
                    try {
                        const callbackResponse = await fetch('/api/payment-callback', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                sessionId,
                                userId,
                                userEmail
                            })
                        });
                        
                        const callbackResult = await callbackResponse.json();
                        console.log('Payment callback result:', callbackResult);
                        
                        if (callbackResult.success) {
                            console.log('Booking confirmed successfully via payment callback');
                        }
                    } catch (callbackError) {
                        console.error('Payment callback error:', callbackError);
                        // Don't fail the whole process if callback fails
                    }
                } else {
                    // Handle legacy PayPal transaction
                    response = await fetch(`/api/transactions/${transactionId}`);
                }
                
                const transactionDetails = await response.json();

                if (!response.ok) {
                    throw new Error(transactionDetails.error || 'Could not verify your purchase.');
                }

                // Handle Supabase-integrated response
                const productTypeResponse = transactionDetails.product?.type;
                const isCoachingSession = productTypeResponse === 'coaching_individual' || productTypeResponse === 'coaching_team';
                const bookingDetails = transactionDetails.bookingDetails;

                if (isCoachingSession) {
                    setStatus('success');
                    let successMessage = 'Purchase verified! Your coaching session has been booked successfully!';
                    
                    if (bookingDetails?.selectedTimeSlot) {
                        const bookingDate = new Date(bookingDetails.selectedTimeSlot).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        successMessage += ` Your session is scheduled for ${bookingDate}.`;
                    }
                    
                    setMessage(successMessage);
                    
                    // Clear selected time slot from session storage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('selectedTimeSlot');
                    }

                    // Show success for coaching with booking confirmation
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 5000);

                } else if (productTypeResponse === 'pdf' || productTypeResponse === 'digital_product') {
                    setStatus('success');
                    setMessage('Purchase verified! Your PDF is ready for download.');
                    setProductType('pdf');
                    
                    // Set download URL for the button
                    const url = sessionId ? 
                        `/api/download-pdf?session_id=${sessionId}` : 
                        `/api/download-pdf?transaction_id=${transactionId}`;
                    setDownloadUrl(url);

                    // Redirect to dashboard after some time
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 30000);
                
                } else {
                    // Handle any other product types or show general success
                    setStatus('success');
                    setMessage(`Purchase verified! Thank you for your purchase of ${transactionDetails.product?.name || 'our product'}.`);
                    
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 4000);
                }

            } catch (err) {
                setStatus('error');
                setMessage(err.message);
            }
        };

        const timer = setTimeout(() => {
            processTransaction();
        }, 2000);

        return () => clearTimeout(timer);

    }, [transactionId, router]);

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <div className="w-full max-w-lg">
                    
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-6">
                            <Spinner />
                            <h1 className="text-3xl font-bold text-gray-300">{message}</h1>
                        </div>
                    )}

                    {status === 'success' && (
                         <div className="flex flex-col items-center gap-6">
                            <svg className="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h1 className="text-4xl font-bold text-green-400">Thank You!</h1>
                            <p className="text-lg text-gray-300">{message}</p>
                            
                            {/* PDF Download Button */}
                            {productType === 'pdf' && downloadUrl && (
                                <div className="mt-6 space-y-4">
                                    <a
                                        href={downloadUrl}
                                        download="IMPACT.pdf"
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        Download Your PDF
                                    </a>
                                    <p className="text-sm text-gray-400">
                                        You can also re-download this file anytime from your dashboard
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                         <div className="flex flex-col items-center gap-6">
                            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h1 className="text-4xl font-bold text-red-500">An Error Occurred</h1>
                            <p className="text-lg text-red-300 bg-red-900/30 p-4 rounded-lg">{message}</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}