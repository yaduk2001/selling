import { NextResponse } from 'next/server';
import { getTimezoneForCountry, getCountryName } from '@/lib/country-timezone-mapping';

export async function GET(request) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1';

    // For development/localhost, return a default country
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      return NextResponse.json({
        success: true,
        country: {
          code: 'US', // Default to US for development
          name: 'United States',
          timezone: 'America/New_York',
          detected: false,
          reason: 'Development environment'
        }
      });
    }

    // Use a free IP geolocation service
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode,timezone,query`);
    
    if (!geoResponse.ok) {
      throw new Error('Failed to fetch geolocation data');
    }

    const geoData = await geoResponse.json();

    if (geoData.status === 'fail') {
      throw new Error(geoData.message || 'Failed to detect location');
    }

    // Get timezone based on country
    const timezone = getTimezoneForCountry(geoData.countryCode);
    const countryName = getCountryName(geoData.countryCode);

    return NextResponse.json({
      success: true,
      country: {
        code: geoData.countryCode,
        name: countryName,
        timezone: timezone,
        detected: true,
        ip: clientIp,
        api_timezone: geoData.timezone // From IP API
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
