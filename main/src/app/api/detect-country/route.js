import { NextResponse } from 'next/server';
import { getTimezoneForCountry, getCountryName } from '@/lib/country-timezone-mapping';

export async function GET(request) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1';

    // For development/localhost, try to detect browser timezone first
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      console.log('🔧 Development environment detected, using browser timezone for country detection');
      
      // Try to get browser timezone from request headers or use a default
      const browserTimezone = request.headers.get('x-browser-timezone') || 'America/New_York';
      console.log(`🌍 Browser timezone received: ${browserTimezone}`);
      
      // Map common browser timezones to countries
      const timezoneToCountry = {
        // North America
        'America/New_York': { code: 'US', name: 'United States' },
        'America/Chicago': { code: 'US', name: 'United States' },
        'America/Denver': { code: 'US', name: 'United States' },
        'America/Los_Angeles': { code: 'US', name: 'United States' },
        'America/Toronto': { code: 'CA', name: 'Canada' },
        'America/Vancouver': { code: 'CA', name: 'Canada' },
        'America/Mexico_City': { code: 'MX', name: 'Mexico' },
        
        // Europe
        'Europe/London': { code: 'GB', name: 'United Kingdom' },
        'Europe/Paris': { code: 'FR', name: 'France' },
        'Europe/Berlin': { code: 'DE', name: 'Germany' },
        'Europe/Rome': { code: 'IT', name: 'Italy' },
        'Europe/Madrid': { code: 'ES', name: 'Spain' },
        'Europe/Amsterdam': { code: 'NL', name: 'Netherlands' },
        'Europe/Zurich': { code: 'CH', name: 'Switzerland' },
        'Europe/Vienna': { code: 'AT', name: 'Austria' },
        'Europe/Brussels': { code: 'BE', name: 'Belgium' },
        'Europe/Stockholm': { code: 'SE', name: 'Sweden' },
        'Europe/Oslo': { code: 'NO', name: 'Norway' },
        'Europe/Copenhagen': { code: 'DK', name: 'Denmark' },
        'Europe/Helsinki': { code: 'FI', name: 'Finland' },
        'Europe/Warsaw': { code: 'PL', name: 'Poland' },
        'Europe/Prague': { code: 'CZ', name: 'Czech Republic' },
        'Europe/Budapest': { code: 'HU', name: 'Hungary' },
        'Europe/Bucharest': { code: 'RO', name: 'Romania' },
        'Europe/Sofia': { code: 'BG', name: 'Bulgaria' },
        'Europe/Athens': { code: 'GR', name: 'Greece' },
        'Europe/Lisbon': { code: 'PT', name: 'Portugal' },
        'Europe/Dublin': { code: 'IE', name: 'Ireland' },
        'Europe/Moscow': { code: 'RU', name: 'Russia' },
        'Europe/Kiev': { code: 'UA', name: 'Ukraine' },
        'Europe/Istanbul': { code: 'TR', name: 'Turkey' },
        
        // Asia
        'Asia/Tokyo': { code: 'JP', name: 'Japan' },
        'Asia/Shanghai': { code: 'CN', name: 'China' },
        'Asia/Kolkata': { code: 'IN', name: 'India' },
        'Asia/Calcutta': { code: 'IN', name: 'India' }, // Alternative name
        'Asia/Singapore': { code: 'SG', name: 'Singapore' },
        'Asia/Kuala_Lumpur': { code: 'MY', name: 'Malaysia' },
        'Asia/Bangkok': { code: 'TH', name: 'Thailand' },
        'Asia/Ho_Chi_Minh': { code: 'VN', name: 'Vietnam' },
        'Asia/Jakarta': { code: 'ID', name: 'Indonesia' },
        'Asia/Manila': { code: 'PH', name: 'Philippines' },
        'Asia/Taipei': { code: 'TW', name: 'Taiwan' },
        'Asia/Hong_Kong': { code: 'HK', name: 'Hong Kong' },
        'Asia/Macau': { code: 'MO', name: 'Macau' },
        'Asia/Dhaka': { code: 'BD', name: 'Bangladesh' },
        'Asia/Karachi': { code: 'PK', name: 'Pakistan' },
        'Asia/Colombo': { code: 'LK', name: 'Sri Lanka' },
        'Asia/Kathmandu': { code: 'NP', name: 'Nepal' },
        'Asia/Thimphu': { code: 'BT', name: 'Bhutan' },
        'Asia/Yangon': { code: 'MM', name: 'Myanmar' },
        'Asia/Phnom_Penh': { code: 'KH', name: 'Cambodia' },
        'Asia/Vientiane': { code: 'LA', name: 'Laos' },
        'Asia/Ulaanbaatar': { code: 'MN', name: 'Mongolia' },
        'Asia/Almaty': { code: 'KZ', name: 'Kazakhstan' },
        'Asia/Tashkent': { code: 'UZ', name: 'Uzbekistan' },
        'Asia/Bishkek': { code: 'KG', name: 'Kyrgyzstan' },
        'Asia/Dushanbe': { code: 'TJ', name: 'Tajikistan' },
        'Asia/Ashgabat': { code: 'TM', name: 'Turkmenistan' },
        'Asia/Kabul': { code: 'AF', name: 'Afghanistan' },
        'Asia/Tehran': { code: 'IR', name: 'Iran' },
        'Asia/Baghdad': { code: 'IQ', name: 'Iraq' },
        'Asia/Riyadh': { code: 'SA', name: 'Saudi Arabia' },
        'Asia/Dubai': { code: 'AE', name: 'United Arab Emirates' },
        'Asia/Qatar': { code: 'QA', name: 'Qatar' },
        'Asia/Kuwait': { code: 'KW', name: 'Kuwait' },
        'Asia/Bahrain': { code: 'BH', name: 'Bahrain' },
        'Asia/Muscat': { code: 'OM', name: 'Oman' },
        'Asia/Aden': { code: 'YE', name: 'Yemen' },
        'Asia/Amman': { code: 'JO', name: 'Jordan' },
        'Asia/Beirut': { code: 'LB', name: 'Lebanon' },
        'Asia/Damascus': { code: 'SY', name: 'Syria' },
        'Asia/Jerusalem': { code: 'IL', name: 'Israel' },
        'Asia/Gaza': { code: 'PS', name: 'Palestine' },
        'Asia/Nicosia': { code: 'CY', name: 'Cyprus' },
        'Asia/Seoul': { code: 'KR', name: 'South Korea' },
        
        // Australia & Oceania
        'Australia/Sydney': { code: 'AU', name: 'Australia' },
        'Australia/Melbourne': { code: 'AU', name: 'Australia' },
        'Australia/Brisbane': { code: 'AU', name: 'Australia' },
        'Australia/Perth': { code: 'AU', name: 'Australia' },
        'Australia/Adelaide': { code: 'AU', name: 'Australia' },
        'Australia/Darwin': { code: 'AU', name: 'Australia' },
        'Pacific/Auckland': { code: 'NZ', name: 'New Zealand' },
        'Pacific/Fiji': { code: 'FJ', name: 'Fiji' },
        
        // Africa
        'Africa/Cairo': { code: 'EG', name: 'Egypt' },
        'Africa/Johannesburg': { code: 'ZA', name: 'South Africa' },
        'Africa/Lagos': { code: 'NG', name: 'Nigeria' },
        'Africa/Nairobi': { code: 'KE', name: 'Kenya' },
        'Africa/Casablanca': { code: 'MA', name: 'Morocco' },
        'Africa/Tunis': { code: 'TN', name: 'Tunisia' },
        'Africa/Algiers': { code: 'DZ', name: 'Algeria' },
        
        // South America
        'America/Sao_Paulo': { code: 'BR', name: 'Brazil' },
        'America/Buenos_Aires': { code: 'AR', name: 'Argentina' },
        'America/Santiago': { code: 'CL', name: 'Chile' },
        'America/Lima': { code: 'PE', name: 'Peru' },
        'America/Bogota': { code: 'CO', name: 'Colombia' },
        'America/Caracas': { code: 'VE', name: 'Venezuela' }
      };
      
      const countryInfo = timezoneToCountry[browserTimezone] || { code: 'US', name: 'United States' };
      
      return NextResponse.json({
        success: true,
        country: {
          code: countryInfo.code,
          name: countryInfo.name,
          timezone: browserTimezone,
          detected: true, // Mark as detected even in development
          reason: 'Development environment with browser timezone'
        }
      });
    }

    console.log(`🌍 Production environment detected, using real IP geolocation for: ${clientIp}`);
    
    // Use a free IP geolocation service
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode,timezone,query`);
    
    if (!geoResponse.ok) {
      throw new Error('Failed to fetch geolocation data');
    }

    const geoData = await geoResponse.json();
    console.log(`📊 IP API Response:`, geoData);

    if (geoData.status === 'fail') {
      throw new Error(geoData.message || 'Failed to detect location');
    }

    // Get timezone based on country
    const timezone = getTimezoneForCountry(geoData.countryCode);
    const countryName = getCountryName(geoData.countryCode);
    
    console.log(`🌍 Real IP Detection: ${countryName} (${geoData.countryCode}) - Timezone: ${timezone}`);

    return NextResponse.json({
      success: true,
      country: {
        code: geoData.countryCode,
        name: countryName,
        timezone: timezone,
        detected: true,
        ip: clientIp,
        api_timezone: geoData.timezone, // From IP API
        reason: 'Real IP geolocation'
      }
    });

  } catch (error) {
    console.error('Error detecting country:', error);
    
    // Fallback to UTC if detection fails
    return NextResponse.json({
      success: true,
      country: {
        code: 'DEFAULT',
        name: 'Unknown',
        timezone: 'UTC',
        detected: false,
        reason: error.message
      }
    });
  }
}
