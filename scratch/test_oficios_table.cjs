const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xxxx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'xxxx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking official_oficios table...');
  const { data, error } = await supabase
    .from('official_oficios')
    .select('*')
    .limit(5);

  console.log('Error:', error);
  console.log('Data:', data);
}

checkTable();
