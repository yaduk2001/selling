import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Review ID is required' 
      }, { status: 400 });
    }

    // Update review - only update basic fields that exist in testimonials table
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (body.name !== undefined) updateData.customer_name = body.name;
    if (body.content !== undefined) updateData.review_text = body.content;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.is_approved !== undefined) updateData.is_approved = body.is_approved;

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update review' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0]
    });

  } catch (error) {
    console.error('Error in update review API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Review ID is required' 
      }, { status: 400 });
    }

    // Delete review
    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete review' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete review API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
