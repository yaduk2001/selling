// FILE: src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow all authenticated users - implement proper admin role checking

    // Get total bookings count
    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (bookingsError) {
      console.error('Error fetching bookings count:', bookingsError);
    }

    // Get total revenue from completed bookings
    const { data: revenueData, error: revenueError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed');

    let totalRevenue = 0;
    if (!revenueError && revenueData) {
      // Calculate total revenue - we need to get product prices
      const productIds = [...new Set(revenueData.map(booking => booking.product_id))];
      
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, price')
          .in('id', productIds);

        if (!productsError && products) {
          const productPriceMap = products.reduce((acc, product) => {
            acc[product.id] = product.price;
            return acc;
          }, {});

          totalRevenue = revenueData.reduce((sum, booking) => {
            const price = productPriceMap[booking.product_id] || 0;
            return sum + (price / 100); // Convert cents to dollars
          }, 0);
        }
      }
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
    }

    // Get pending bookings (from reservations that haven't expired)
    const { count: pendingBookings, error: pendingError } = await supabase
      .from('booking_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (pendingError) {
      console.error('Error fetching pending bookings:', pendingError);
    }

    // Get recent bookings with customer info
    const { data: recentBookings, error: recentBookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        product_id,
        customer_email,
        created_at,
        profiles (
          full_name,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get product prices for recent bookings
    let recentBookingsWithPrices = [];
    if (!recentBookingsError && recentBookings) {
      const productIds = [...new Set(recentBookings.map(booking => booking.product_id))];
      
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, price, name')
          .in('id', productIds);

        const productMap = products?.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {}) || {};

        recentBookingsWithPrices = recentBookings.map(booking => ({
          id: booking.id,
          customerName: booking.profiles?.full_name || 
                      `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim() ||
                      'Unknown Customer',
          customerEmail: booking.customer_email,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          status: booking.status,
          amount: productMap[booking.product_id]?.price ? (productMap[booking.product_id].price / 100) : 0,
          productName: productMap[booking.product_id]?.name || 'Unknown Product'
        }));
      }
    }

    // Get recent users
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get booking counts for recent users
    let recentUsersWithBookings = [];
    if (!recentUsersError && recentUsers) {
      const userIds = recentUsers.map(user => user.id);
      
      const { data: userBookingCounts } = await supabase
        .from('bookings')
        .select('user_id')
        .in('user_id', userIds);

      const bookingCountMap = (userBookingCounts || []).reduce((acc, booking) => {
        acc[booking.user_id] = (acc[booking.user_id] || 0) + 1;
        return acc;
      }, {});

      recentUsersWithBookings = recentUsers.map(user => ({
        id: user.id,
        name: user.full_name || 
              `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
              'Unknown User',
        email: user.email,
        joinedAt: new Date(user.created_at).toLocaleDateString(),
        totalBookings: bookingCountMap[user.id] || 0
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings: totalBookings || 0,
          totalRevenue: Math.round(totalRevenue),
          totalUsers: totalUsers || 0,
          pendingBookings: pendingBookings || 0
        },
        recentBookings: recentBookingsWithPrices,
        recentUsers: recentUsersWithBookings
      }
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
