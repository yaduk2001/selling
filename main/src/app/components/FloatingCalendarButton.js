// FloatingCalendarButton Component
'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

const FloatingCalendarButton = () => {
    return (
        <Link href="/calendar">
            <div className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors cursor-pointer z-40">
                <Calendar size={24} />
            </div>
        </Link>
    );
};

export default FloatingCalendarButton;
