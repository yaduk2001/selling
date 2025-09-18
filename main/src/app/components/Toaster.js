// Toaster Component
'use client';

import React from 'react';

const Toaster = ({ message, show }) => {
    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            {message}
        </div>
    );
};

export default Toaster;
