const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list() {
  const { data, error } = await supabase.from('enrollments').select('status');
  if (error) {
    console.error(error);
    return;
  }
  const statuses = [...new Set(data.map(d => d.status))];
  console.log("Found statuses:", statuses);
}

list();
