// FILE: app/layout.js
// Phase 2 - Upgraded with ThemeProvider for Light/Dark Mode

import { Montserrat, Lato } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const lato = Lato({ 
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Selling Infinity - Generated $20 million in sales',
  description: 'Training sales reps to make millions a year. Getting that promotion and new high-paying clients is easy.',
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
    shortcut: '/Logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${montserrat.variable} ${lato.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <link rel="shortcut icon" href="/Logo.png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-body bg-gray-900 text-gray-100 antialiased transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
