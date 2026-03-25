
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const table = 'psychosocial_referrals';
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    if (error.code === 'PGRST116') {
        console.log(`Table ${table} exists but is empty.`);
    } else if (error.code === '42P01') {
        console.log(`Table ${table} DOES NOT EXIST.`);
    } else {
        console.log(`Table ${table}: ERROR - ${error.message} (${error.code})`);
    }
    // Try the fallback table
    const { data: data2, error: error2 } = await supabase.from('referrals').select('*').limit(1);
    if (error2) {
      console.log(`Table referrals: ERROR - ${error2.message} (${error2.code})`);
    } else {
      console.log(`Table referrals: OK`);
    }
  } else {
    console.log(`Table ${table}: OK`);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, cannot easily check columns without access to information_schema.');
    }
  }
}

checkColumns();
