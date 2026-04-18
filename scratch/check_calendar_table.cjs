
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('calendar_tracking')
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('not found')) {
      console.log('Table calendar_tracking DOES NOT EXIST');
    } else {
      console.error('Error checking table:', error);
    }
  } else {
    console.log('Table calendar_tracking EXISTS');
  }
}

checkTable();
