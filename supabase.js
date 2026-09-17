const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Vercel Environment Variables मधून Supabase कनेक्ट करणे
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;