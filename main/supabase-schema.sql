-- SELLING INFINITY DATABASE SCHEMA
-- Phase 1: Complete database architecture with RLS policies
-- Execute this SQL in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE product_type AS ENUM ('pdf', 'coaching_individual', 'coaching_team');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price INTEGER NOT NULL, -- Price in cents
    description TEXT,
    features JSONB, -- Array of feature strings
    type product_type NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TESTIMONIALS TABLE
-- =============================================
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    review_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    status transaction_status DEFAULT 'pending',
    stripe_session_id TEXT UNIQUE,
    booking_timestamp TIMESTAMPTZ, -- For coaching sessions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CALENDAR EVENTS TABLE
-- =============================================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    customer_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADMIN USERS TABLE (for admin authentication)
-- =============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_stripe_session ON transactions(stripe_session_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Products policies (public read access)
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Testimonials policies (approved ones are publicly readable)
CREATE POLICY "Approved testimonials are publicly readable" ON testimonials
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Only admins can manage testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Transactions policies (users can only see their own)
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Only admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update transactions" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Calendar events policies
CREATE POLICY "Users can view their booking events" ON calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t 
            WHERE t.id = calendar_events.transaction_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can manage all calendar events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "System can insert calendar events" ON calendar_events
    FOR INSERT WITH CHECK (true);

-- Admin users policies
CREATE POLICY "Only existing admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- SEED DATA (Initial Content)
-- =============================================

-- Insert the three pricing plans
INSERT INTO products (name, price, description, features, type, is_popular) VALUES 
(
    'Sales PDF',
    4900, -- $49.00
    '50 chapters from basics to advanced',
    '["50 chapters from basics to advanced.", "In-depth knowledge of sales tactics.", "Real-world application guides.", "Build consistent income."]',
    'pdf',
    false
),
(
    '1-on-1 Sales Coaching',
    49900, -- $499.00
    '1-hour deep dive session',
    '["1-hour deep dive session.", "Crush your fear of rejection.", "Get feedback on your pitch.", "Build a system for high-rolling."]',
    'coaching_individual',
    true
),
(
    'Team Sales Coaching',
    199900, -- $1999.00
    '60-minute intensive sales workshop',
    '["60-minute intensive sales workshop.", "Empower your team to persevere.", "Battle-tested, real-world strategies.", "Shift your team into beast mode."]',
    'coaching_team',
    false
);

-- Insert the testimonials
INSERT INTO testimonials (customer_name, review_text, rating, is_approved) VALUES 
(
    'Lauryn Cassells',
    'Shrey taught me many skills in sales that now reflect in my everyday life. He cares about his team and wants to see you achieve your goals in and out of the workplace. He is calming, caring and has a strong mentality. He helped me to build my can do attitude and changed my mindset to a much more positive state. That coupled with his sales techniques makes him the best coach.',
    5,
    true
),
(
    'Garvit Chaudhary',
    'Working with Shrey has been a game-changer for me. His mentorship not only sharpened my sales skills but completely transformed the way I approach fundraising. Shrey doesn''t just teach techniques-he instills confidence, clarity, and a results-driven mindset. His ability to simplify complex sales psychology and turn it into practical, high-impact strategies is unmatched. Thanks to his guidance, I''ve closed more donors, handled objections with ease, and built stronger relationships on the field. If you''re serious about leveling up in sales or fundraising, Shrey is the mentor you need in your corner.',
    5,
    true
),
(
    'Akshay Sharma',
    'Shrey is a powerhouse when it comes to sales coaching. His book isn''t just another sales manual — it''s a mindset shift. He breaks down complex skills into simple, actionable steps and teaches the law of averages, rejection handling, and closing with a clarity that sticks. Whether you''re new to sales or a seasoned rep looking to level up, Shrey''s approach will sharpen your game and reignite your drive. A must-read for anyone serious about mastering sales.',
    5,
    true
);

-- Create the first admin user (you'll need to sign up first, then update this)
-- INSERT INTO admin_users (user_id, email) VALUES ('your-auth-user-id-here', 'admin@sellinginfinity.com');

-- =============================================
-- GRANTS (if needed)
-- =============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON products TO anon;
GRANT SELECT ON testimonials TO anon;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON calendar_events TO authenticated;

-- Schema setup complete!
