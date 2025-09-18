// Timezone utility functions for consistent date/time handling across the application

/**
 * Convert a date string to a specific timezone
 * @param {string|Date} date - The date to convert
 * @param {string} timezone - Target timezone (e.g., 'America/New_York')
 * @returns {Date} - Date object in the specified timezone
 */
export function convertToTimezone(date, timezone) {
  try {
    const dateObj = new Date(date);
    return new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  } catch (error) {
    console.error('Error converting to timezone:', error);
    return new Date(date);
  }
}

/**
 * Convert a local time to UTC for storage
 * @param {string|Date} localDate - Local date/time
 * @param {string} timezone - Source timezone
 * @returns {Date} - UTC date object
 */
export function convertLocalToUTC(localDate, timezone) {
  try {
    const date = new Date(localDate);
    // Get the timezone offset for the specified timezone
    const utc = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (target.getTime() - utc.getTime()) / 60000;
    return new Date(date.getTime() - (offset * 60000));
  } catch (error) {
    console.error('Error converting local to UTC:', error);
    return new Date(localDate);
  }
}

/**
 * Format time in a specific timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - Target timezone
 * @param {object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export function formatTimeInTimezone(date, timezone, options = {}) {
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
}

/**
 * Format date in a specific timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - Target timezone
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDateInTimezone(date, timezone, options = {}) {
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
}

/**
 * Get timezone offset in minutes
 * @param {string} timezone - Target timezone
 * @returns {number} - Offset in minutes from UTC
 */
export function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (target.getTime() - utc.getTime()) / 60000;
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
}

/**
 * Check if a date is in the past (considering timezone)
 * @param {string|Date} date - The date to check
 * @param {string} timezone - Timezone to consider
 * @returns {boolean} - True if date is in the past
 */
export function isDateInPast(date, timezone) {
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const dateInTimezone = convertToTimezone(dateObj, timezone);
    const nowInTimezone = convertToTimezone(now, timezone);
    return dateInTimezone < nowInTimezone;
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return new Date(date) < new Date();
  }
}

/**
 * Get current time in a specific timezone
 * @param {string} timezone - Target timezone
 * @returns {Date} - Current time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone) {
  try {
    return new Date().toLocaleString('en-US', { timeZone: timezone });
  } catch (error) {
    console.error('Error getting current time:', error);
    return new Date().toLocaleString();
  }
}

/**
 * Create a date string in YYYY-MM-DD format for a specific timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - Target timezone
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function formatDateForAPI(date, timezone) {
  try {
    const dateObj = new Date(date);
    const dateInTimezone = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
    const year = dateInTimezone.getFullYear();
    const month = String(dateInTimezone.getMonth() + 1).padStart(2, '0');
    const day = String(dateInTimezone.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for API:', error);
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Create a time string in HH:MM format for a specific timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - Target timezone
 * @returns {string} - Time string in HH:MM format
 */
export function formatTimeForAPI(date, timezone) {
  try {
    const dateObj = new Date(date);
    const dateInTimezone = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
    const hours = String(dateInTimezone.getHours()).padStart(2, '0');
    const minutes = String(dateInTimezone.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time for API:', error);
    const dateObj = new Date(date);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Convert a booking time to UTC for database storage
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @param {string} timezone - Source timezone
 * @returns {string} - UTC ISO string
 */
export function convertBookingToUTC(date, time, timezone) {
  try {
    const localDateTime = `${date}T${time}:00`;
    const localDate = new Date(localDateTime);
    const utcDate = convertLocalToUTC(localDate, timezone);
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting booking to UTC:', error);
    return new Date(`${date}T${time}:00`).toISOString();
  }
}

/**
 * Convert UTC booking time to local timezone for display
 * @param {string} utcDateTime - UTC ISO string
 * @param {string} timezone - Target timezone
 * @returns {object} - Object with date and time strings
 */
export function convertUTCToLocal(utcDateTime, timezone) {
  try {
    const utcDate = new Date(utcDateTime);
    const localDate = convertToTimezone(utcDate, timezone);
    return {
      date: formatDateForAPI(localDate, timezone),
      time: formatTimeForAPI(localDate, timezone)
    };
  } catch (error) {
    console.error('Error converting UTC to local:', error);
    const utcDate = new Date(utcDateTime);
    return {
      date: formatDateForAPI(utcDate, 'UTC'),
      time: formatTimeForAPI(utcDate, 'UTC')
    };
  }
}

/**
 * Get timezone abbreviation (e.g., EST, PST, IST)
 * @param {string} timezone - Target timezone
 * @returns {string} - Timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart ? timeZonePart.value : timezone;
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return timezone;
  }
}

/**
 * Validate if a timezone is supported
 * @param {string} timezone - Timezone to validate
 * @returns {boolean} - True if timezone is valid
 */
export function isValidTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all available timezones
 * @returns {Array} - Array of timezone strings
 */
export function getAvailableTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (error) {
    console.error('Error getting available timezones:', error);
    return ['UTC'];
  }
}
