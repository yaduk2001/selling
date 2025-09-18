-- SELLING INFINITY - COMPLETE DATABASE SETUP
-- Run this SINGLE file in your Supabase SQL editor
-- This includes schema creation AND seed data in the correct order

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- RESET SCHEMA (makes the script re-runnable)
-- =============================================
-- Drop tables first, using CASCADE to handle dependencies
DROP TABLE IF EXISTS site_content CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE; -- Add profiles table

-- Drop types after the tables that use them are gone
DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS transaction_status;


-- =============================================
-- CREATE ENUM TYPES FIRST
-- =============================================
CREATE TYPE product_type AS ENUM ('pdf', 'coaching_individual', 'coaching_team');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================
-- CREATE TABLES
-- =============================================

-- USER PROFILES TABLE (extends auth.users with additional information)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL THEN first_name
            WHEN last_name IS NOT NULL THEN last_name
            ELSE NULL
        END
    ) STORED,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS TABLE
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

-- TESTIMONIALS TABLE
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    review_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS TABLE
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

-- CALENDAR EVENTS TABLE
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

-- ADMIN USERS TABLE
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE CONTENT TABLE (for dynamic content management)
CREATE TABLE site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section TEXT NOT NULL UNIQUE, -- 'about', 'hero', etc.
    title TEXT,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_stripe_session ON transactions(stripe_session_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- User profiles policies (users can only see and edit their own profile)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies (public read access)
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage products" ON products
    FOR ALL USING (is_admin());

-- Testimonials policies (approved ones are publicly readable)
CREATE POLICY "Approved testimonials are publicly readable" ON testimonials
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Only admins can manage testimonials" ON testimonials
    FOR ALL USING (is_admin());

-- Transactions policies (users can only see their own)
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Only admins can view all transactions" ON transactions
    FOR SELECT USING (is_admin());

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update transactions" ON transactions
    FOR UPDATE USING (is_admin());

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
    FOR ALL USING (is_admin());

CREATE POLICY "System can insert calendar events" ON calendar_events
    FOR INSERT WITH CHECK (true);

-- Admin users policies
CREATE POLICY "Admins can view other admins" ON admin_users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert new admins" ON admin_users
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update other admins" ON admin_users
    FOR UPDATE USING (is_admin());

-- Site content policies (public read, admin write)
CREATE POLICY "Site content is publicly readable" ON site_content
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage site content" ON site_content
    FOR ALL USING (is_admin());

-- =============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to check if the current user is an active admin
-- SECURITY DEFINER allows this function to bypass RLS policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$;

-- Function to update updated_at timestamp
-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- INSERT SEED DATA - PRODUCTS
-- =============================================
INSERT INTO products (name, price, description, features, type, is_popular) VALUES 
(
    'Sales PDF',
    4900, -- $49.00 in cents
    '50 chapters from basics to advanced',
    '["50 chapters from basics to advanced.", "In-depth knowledge of sales tactics.", "Real-world application guides.", "Build consistent income."]'::jsonb,
    'pdf'::product_type,
    false
),
(
    '1-on-1 Sales Coaching',
    49900, -- $499.00 in cents
    '1-hour deep dive session',
    '["1-hour deep dive session.", "Crush your fear of rejection.", "Get feedback on your pitch.", "Build a system for high-rolling."]'::jsonb,
    'coaching_individual'::product_type,
    true  -- This is the POPULAR plan
),
(
    'Team Sales Coaching',
    199900, -- $1999.00 in cents
    '60-minute intensive sales workshop',
    '["60-minute intensive sales workshop.", "Empower your team to persevere.", "Battle-tested, real-world strategies.", "Shift your team into beast mode."]'::jsonb,
    'coaching_team'::product_type,
    false
);

-- =============================================
-- INSERT SEED DATA - TESTIMONIALS
-- =============================================
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

-- =============================================
-- INSERT SEED DATA - SITE CONTENT
-- =============================================
INSERT INTO site_content (section, title, content) VALUES 
(
    'about',
    'About Shrey',
    'I have been selling and teaching sales for over a decade. My industry of choice was the hardest industry to sell in — selling charities on a monthly subscription both on the streets and in shopping centres. Getting people to commit to monthly donations for charities they had never heard of, from a stranger they had never met before, forced me to master the real art of sales.

I realised that sales psychology goes way deeper than what has been taught to us through different platforms and books. I was required to put on a smile, have an amazing attitude and let my personality shine, which helped me turn customers into friends instantaneously. I learnt that I can make people WANT to buy from me.

You don''t have to go through a million rejections to be great at sales because I have already done that, so now I can help serve you. Go ahead and get that book and coaching class because you are about to save 1000''s of hours in figuring out what actually works!'
),
(
    'hero',
    'Generated $20 million in sales.',
    'Training sales reps to make millions a year. Getting that promotion and new high-paying clients is easy.'
),
(
    'hero_cta',
    'FASTEST way to earn freedom NOW',
    'Primary call-to-action button text'
);

-- =============================================
-- VERIFICATION QUERIES (Run these to check your data)
-- =============================================

-- Check products
SELECT id, name, price/100.0 as price_dollars, description, type, is_popular 
FROM products 
ORDER BY price;

-- Check testimonials  
SELECT customer_name, rating, LEFT(review_text, 100) || '...' as review_preview, is_approved 
FROM testimonials 
ORDER BY created_at;

-- Check site content
SELECT section, title, LEFT(content, 100) || '...' as content_preview 
FROM site_content 
ORDER BY section;

-- =============================================
-- SETUP COMPLETE!
-- =============================================

-- Your database is now ready with:
-- ✅ All tables with proper relationships
-- ✅ Security policies (RLS) protecting user data  
-- ✅ All your actual content (3 products, 3 testimonials, site content)
-- ✅ Performance indexes
-- ✅ Automatic timestamp updates

-- Next steps:
-- 1. Copy your Supabase URL and keys to .env.local
-- 2. Create your first admin user account
-- 3. Test the landing page at http://localhost:3000
