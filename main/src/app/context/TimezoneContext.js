'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const TimezoneContext = createContext({});

export function TimezoneProvider({ children }) {
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [isLoading, setIsLoading] = useState(true);

  // Comprehensive list of timezones with their display names
  const timezoneOptions = [
    // Americas
    { value: 'America/New_York', label: 'Eastern Time (ET)', region: 'Americas' },
    { value: 'America/Chicago', label: 'Central Time (CT)', region: 'Americas' },
    { value: 'America/Denver', label: 'Mountain Time (MT)', region: 'Americas' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', region: 'Americas' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)', region: 'Americas' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', region: 'Americas' },
    { value: 'America/Toronto', label: 'Toronto (EST/EDT)', region: 'Americas' },
    { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', region: 'Americas' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)', region: 'Americas' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'Americas' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'Americas' },
    
    // Europe
    { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Rome', label: 'Rome (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)', region: 'Europe' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', region: 'Europe' },
    
    // Asia
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asia' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia' },
    { value: 'Asia/Kolkata', label: 'India (IST)', region: 'Asia' },
    { value: 'Asia/Calcutta', label: 'India (IST)', region: 'Asia' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Asia' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)', region: 'Asia' },
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', region: 'Asia' },
    { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', region: 'Asia' },
    { value: 'Asia/Manila', label: 'Manila (PHT)', region: 'Asia' },
    { value: 'Asia/Karachi', label: 'Karachi (PKT)', region: 'Asia' },
    { value: 'Asia/Dhaka', label: 'Dhaka (BST)', region: 'Asia' },
    
    // Australia & Oceania
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', region: 'Australia & Oceania' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', region: 'Australia & Oceania' },
    { value: 'Australia/Perth', label: 'Perth (AWST)', region: 'Australia & Oceania' },
    { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)', region: 'Australia & Oceania' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', region: 'Australia & Oceania' },
    
    // Africa
    { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa' },
    
    // UTC
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'UTC' }
  ];

  // Detect user's timezone automatically
  useEffect(() => {
    const detectTimezone = async () => {
      try {
        console.log('🌍 Starting timezone detection...');
        
        // First, try to detect country and get timezone from country
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryResponse = await fetch('/api/detect-country', {
          headers: {
            'x-browser-timezone': browserTimezone
          }
        });
        const countryData = await countryResponse.json();
        
        if (countryData.success && countryData.country) {
          const countryTimezone = countryData.country.timezone;
          const countryName = countryData.country.name;
          const countryCode = countryData.country.code;
          
          console.log(`🌍 Detected country: ${countryName} (${countryCode}) - Timezone: ${countryTimezone}`);
          console.log(`📊 Country data:`, countryData.country);
          
          // Check if country timezone is in our supported list
          const supportedTimezone = timezoneOptions.find(tz => tz.value === countryTimezone);
          console.log(`🔍 Supported timezone check:`, supportedTimezone ? 'FOUND' : 'NOT FOUND');
          
          if (supportedTimezone) {
            console.log(`✅ Setting timezone to: ${countryTimezone} (${countryName})`);
            setUserTimezone(countryTimezone);
            localStorage.setItem('userTimezone', countryTimezone);
            localStorage.setItem('userCountry', JSON.stringify(countryData.country));
            console.log(`💾 Saved to localStorage: ${countryTimezone}`);
            setIsLoading(false);
            return;
          } else {
            console.log(`⚠️ Country timezone ${countryTimezone} not in supported list, trying browser timezone`);
            console.log(`📋 Available timezones:`, timezoneOptions.map(tz => tz.value));
          }
        } else {
          console.log(`❌ Country detection failed:`, countryData);
        }
        
        // Fallback to browser timezone detection
        console.log('🌍 Falling back to browser timezone detection...');
        console.log(`🌍 Browser timezone: ${browserTimezone}`);
        
        // Check if it's in our supported list
        const supportedTimezone = timezoneOptions.find(tz => tz.value === browserTimezone);
        
        if (supportedTimezone) {
          console.log(`✅ Setting timezone to browser timezone: ${browserTimezone}`);
          setUserTimezone(browserTimezone);
          localStorage.setItem('userTimezone', browserTimezone);
        } else {
          // Fallback to UTC if timezone not supported
          console.warn(`⚠️ Unsupported browser timezone: ${browserTimezone}, falling back to UTC`);
          setUserTimezone('UTC');
          localStorage.setItem('userTimezone', 'UTC');
        }
        
      } catch (error) {
        console.error('❌ Error detecting timezone:', error);
        console.log('🔄 Falling back to UTC due to error');
        setUserTimezone('UTC');
        localStorage.setItem('userTimezone', 'UTC');
      } finally {
        setIsLoading(false);
      }
    };

    // Always run timezone detection to ensure it's up to date
    console.log('🔄 Running timezone detection...');
    detectTimezone();
  }, []);

  // Update timezone
  const updateTimezone = (timezone) => {
    if (timezoneOptions.find(tz => tz.value === timezone)) {
      setUserTimezone(timezone);
      localStorage.setItem('userTimezone', timezone);
    } else {
      console.error('Invalid timezone:', timezone);
    }
  };

  // Get timezone info
  const getTimezoneInfo = (timezone = userTimezone) => {
    return timezoneOptions.find(tz => tz.value === timezone) || timezoneOptions.find(tz => tz.value === 'UTC');
  };

  // Get detected country info
  const getDetectedCountry = () => {
    try {
      const storedCountry = localStorage.getItem('userCountry');
      return storedCountry ? JSON.parse(storedCountry) : null;
    } catch (error) {
      console.error('Error parsing stored country:', error);
      return null;
    }
  };

  // Format time in user's timezone
  const formatTimeInTimezone = (date, timezone = userTimezone, options = {}) => {
    try {
      const defaultOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      };
      
      return new Date(date).toLocaleTimeString('en-US', { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting time:', error);
      return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  // Format date in user's timezone
  const formatDateInTimezone = (date, timezone = userTimezone, options = {}) => {
    try {
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: timezone
      };
      
      return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Convert UTC time to user timezone
  const convertToUserTimezone = (utcDate, timezone = userTimezone) => {
    try {
      const date = new Date(utcDate);
      return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    } catch (error) {
      console.error('Error converting timezone:', error);
      return new Date(utcDate);
    }
  };

  // Convert user timezone to UTC
  const convertToUTC = (localDate, timezone = userTimezone) => {
    try {
      // Create a date in the specified timezone
      const date = new Date(localDate);
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      const targetTime = new Date(utcTime + (getTimezoneOffset(timezone) * 60000));
      return targetTime;
    } catch (error) {
      console.error('Error converting to UTC:', error);
      return new Date(localDate);
    }
  };

  // Get timezone offset in minutes
  const getTimezoneOffset = (timezone = userTimezone) => {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
      return (target.getTime() - utc.getTime()) / 60000;
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return 0;
    }
  };

  // Get current time in user timezone
  const getCurrentTimeInTimezone = (timezone = userTimezone) => {
    try {
      return new Date().toLocaleString('en-US', { timeZone: timezone });
    } catch (error) {
      console.error('Error getting current time:', error);
      return new Date().toLocaleString();
    }
  };

  // Group timezones by region
  const getTimezonesByRegion = () => {
    const grouped = {};
    timezoneOptions.forEach(tz => {
      if (!grouped[tz.region]) {
        grouped[tz.region] = [];
      }
      grouped[tz.region].push(tz);
    });
    return grouped;
  };

  const value = {
    userTimezone,
    isLoading,
    timezoneOptions,
    updateTimezone,
    getTimezoneInfo,
    getDetectedCountry,
    formatTimeInTimezone,
    formatDateInTimezone,
    convertToUserTimezone,
    convertToUTC,
    getTimezoneOffset,
    getCurrentTimeInTimezone,
    getTimezonesByRegion
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
