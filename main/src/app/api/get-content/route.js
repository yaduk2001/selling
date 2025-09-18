// FILE: api/get-content/route.js
// API route to fetch all content data from Supabase
// Phase 1 - Data fetching for landing page

import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch products (pricing plans)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('price', { ascending: true });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch approved testimonials only
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
      throw testimonialsError;
    }

    // Fetch site content (hero, about, etc.)
    const { data: siteContent, error: contentError } = await supabase
      .from('site_content')
      .select('*');

    if (contentError) {
      console.error('Error fetching site content:', contentError);
      // Don't throw here, site_content table might not exist yet
      console.log('Site content table not found, using default content');
    }

    // Transform site content into a more usable format
    const contentMap = {};
    siteContent?.forEach(item => {
      contentMap[item.section] = {
        title: item.title,
        content: item.content,
        metadata: item.metadata
      };
    });

    return NextResponse.json({
      success: true,
      products: products || [],
      testimonials: testimonials || [],
      content: contentMap || {}
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });

  } catch (error) {
    console.error('API Error in get-content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
