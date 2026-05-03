const { createClient } = require('@supabase/supabase-js');

// This uses your Render environment variables
const supabaseAdmin = createClient(
  'https://hcriatxprcifgwfqokbw.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

module.exports = { supabaseAdmin };