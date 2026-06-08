const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectStudentsTable() {
  const { data, error } = await supabase.from('students').select('*').limit(1);
  console.log('Students schema sample:', data, error);
}

inspectStudentsTable();
