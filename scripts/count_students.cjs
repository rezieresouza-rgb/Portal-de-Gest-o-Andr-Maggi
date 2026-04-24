const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function count() {
  const { count, error } = await supabase.from('students').select('id', { count: 'exact', head: true });
  if (error) console.error(error);
  else console.log(`Total students: ${count}`);
}

count();
