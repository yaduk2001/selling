import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get all reviews/testimonials
    const { data: reviews, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      // Return empty array if table doesn't exist
      return NextResponse.json({ 
        success: true, 
        reviews: []
      });
    }

    console.log('Fetched testimonials:', reviews?.length || 0, 'records');
    if (reviews?.length > 0) {
      console.log('Sample testimonial:', JSON.stringify(reviews[0], null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      reviews: reviews || []
    });

  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, content, rating, position, company, image_url, is_approved } = body;

    if (!name || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and content are required' 
      }, { status: 400 });
    }

    // Insert new review
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        customer_name: name,
        review_text: content,
        rating: rating || 5,
        position,
        company,
        image_url,
        is_approved: is_approved !== undefined ? is_approved : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create review' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0]
    });

  } catch (error) {
    console.error('Error in create review API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
