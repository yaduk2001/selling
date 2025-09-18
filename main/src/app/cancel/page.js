// FILE: app/cancel/page.js
// This is the page users see if they cancel the payment.

'use client';

import React from 'react';
import Link from 'next/link';

export default function CancelPage() {
    return (
         <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <main className="text-center w-full max-w-4xl">
                <div className="p-8 sm:p-10 bg-gray-800 rounded-lg shadow-xl">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-3xl sm:text-4xl font-bold text-red-400 mb-4">Payment Canceled</h1>
                    <p className="text-gray-300 mb-8 text-lg">Your payment was not completed. You have not been charged.</p>
                    <Link href="/" className="mt-6 inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-300">
                        Return to Homepage
                    </Link>
                </div>
            </main>
        </div>
    );
}

