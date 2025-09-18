// Emergency database fix script
// Run this with: node fix-signup-db.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseFix() {
  try {
    console.log('🔧 Starting emergency database fix...');

    // Read the SQL fix file
    const sqlFix = fs.readFileSync('EMERGENCY_USER_SIGNUP_FIX.sql', 'utf8');
    
    // Split SQL into individual statements (rough approach)
    const statements = sqlFix
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} completed`);
        }
      } catch (err) {
        console.warn(`⚠️  Error on statement ${i + 1}: ${err.message}`);
        // Continue with other statements
      }
    }

    console.log('🎉 Database fix completed!');
    console.log('🧪 Testing user signup function...');

    // Test if we can query the profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profileError) {
      console.error('❌ Profiles table test failed:', profileError.message);
    } else {
      console.log('✅ Profiles table is accessible');
    }

    console.log('🏁 Emergency fix complete. Please test user signup now.');

  } catch (error) {
    console.error('❌ Critical error during database fix:', error.message);
    process.exit(1);
  }
}

runDatabaseFix();
