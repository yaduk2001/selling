import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_hours')
      .select('*')
      .order('day_of_week');

    if (error) {
      console.error('Error fetching business hours:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // If no data, return default business hours
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        businessHours: getDefaultBusinessHours()
      });
    }

    return NextResponse.json({
      success: true,
      businessHours: data
    });

  } catch (error) {
    console.error('Error fetching business hours:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { businessHours, breaks, holidays } = await request.json();

    // Delete existing business hours
    await supabaseAdmin
      .from('business_hours')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    // Prepare business hours data for insertion
    const businessHoursData = [];
    
    if (businessHours) {
      const dayMapping = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0
      };

      Object.keys(dayMapping).forEach(dayName => {
        if (businessHours[dayName]) {
          businessHoursData.push({
            day_of_week: dayMapping[dayName],
            is_working_day: businessHours[dayName].enabled || false,
            start_time: businessHours[dayName].start || '09:00:00',
            end_time: businessHours[dayName].end || '17:00:00',
            breaks: breaks && breaks[dayName] ? breaks[dayName] : [],
            timezone: 'UTC'
          });
        }
      });
    }

    // Insert new business hours
    if (businessHoursData.length > 0) {
      const { error: hoursError } = await supabaseAdmin
        .from('business_hours')
        .insert(businessHoursData);

      if (hoursError) {
        console.error('Error saving business hours:', hoursError);
        return NextResponse.json(
          { success: false, error: 'Failed to save business hours: ' + hoursError.message },
          { status: 500 }
        );
      }
    }

    // Save holidays if provided
    if (holidays && holidays.length > 0) {
      // Delete existing holidays
      await supabaseAdmin
        .from('holidays')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new holidays
      const { error: holidaysError } = await supabaseAdmin
        .from('holidays')
        .insert(holidays.map(holiday => ({
          name: holiday.name,
          date: holiday.date,
          is_recurring: holiday.recurring || false,
          description: holiday.description || ''
        })));

      if (holidaysError) {
        console.error('Error saving holidays:', holidaysError);
        return NextResponse.json(
          { success: false, error: 'Failed to save holidays: ' + holidaysError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Business hours saved successfully'
    });

  } catch (error) {
    console.error('Error in business hours API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { type, data } = await request.json();

    if (type === 'break') {
      const { id, ...updates } = data;
      const { error } = await supabaseAdmin
        .from('breaks')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating break:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update break: ' + error.message },
          { status: 500 }
        );
      }
    } else if (type === 'holiday') {
      const { id, ...updates } = data;
      const { error } = await supabaseAdmin
        .from('holidays')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating holiday:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save holiday: ' + error.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} updated successfully`
    });

  } catch (error) {
    console.error('Error in business hours API (PUT):', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

function getDefaultBusinessHours() {
  return [
    { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00', breaks: [] },
    { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00', breaks: [] },
    { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00', breaks: [] },
    { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00', breaks: [] },
    { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00', breaks: [] },
    { day_of_week: 6, is_working_day: false, start_time: '10:00:00', end_time: '16:00:00', breaks: [] },
    { day_of_week: 0, is_working_day: false, start_time: '10:00:00', end_time: '16:00:00', breaks: [] }
  ];
}
