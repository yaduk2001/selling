// FILE: app/success/page.js
// It now imports and wraps the new component in <Suspense>.

import React, { Suspense } from 'react';
import SuccessContent from './SuccessContent'; // Make sure the path is correct

// Loading component to show as a fallback
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-xl text-gray-300">Loading Confirmation...</span>
            </div>
        </div>
    );
}


export default function SuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <SuccessContent />
        </Suspense>
    );
}