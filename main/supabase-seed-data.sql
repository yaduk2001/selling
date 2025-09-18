-- SELLING INFINITY - SEED DATA QUERIES
-- Run these queries in your Supabase SQL editor to populate the database with content

-- =============================================
-- INSERT PRODUCTS (Pricing Plans)
-- =============================================

-- Clear existing products first (if needed)
-- DELETE FROM products;

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
-- INSERT TESTIMONIALS
-- =============================================

-- Clear existing testimonials first (if needed)
-- DELETE FROM testimonials;

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
-- INSERT ABOUT CONTENT (Using a custom table)
-- =============================================

-- Create a simple content table for About section and other static content
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section TEXT NOT NULL UNIQUE, -- 'about', 'hero', etc.
    title TEXT,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for site_content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- RLS policy for site_content (public read, admin write)
CREATE POLICY "Site content is publicly readable" ON site_content
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage site content" ON site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Insert About section content
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
-- VERIFICATION QUERIES
-- =============================================

-- Run these to verify your data was inserted correctly:

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
-- ADMIN USER SETUP (Run after first user signup)
-- =============================================

-- After you create your first user account through Supabase Auth, run this:
-- Replace 'your-user-uuid-here' with your actual user ID from auth.users table
-- Replace 'your-email@example.com' with your actual admin email

/*
INSERT INTO admin_users (user_id, email) VALUES 
('your-user-uuid-here', 'your-email@example.com');
*/

-- To find your user ID after signup, run:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- =============================================
-- DATA SUMMARY
-- =============================================

-- Products: 3 pricing plans ($49 PDF, $499 Individual, $1999 Team)
-- Testimonials: 3 five-star reviews (Lauryn, Garvit, Akshay)  
-- Site Content: About section, Hero text, CTA text
-- Admin Users: Ready for you to add yourself after signup

-- All data matches the exact content from your directive
-- Ready for Phase 2 implementation!
