const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: students, error: searchError } = await supabase
    .from('students')
    .select('id, name')
    .ilike('name', '%BEPI METUKTIRE%');

  if (searchError) {
    console.error('Error:', searchError);
    return;
  }
  console.log('Students currently in DB:', JSON.stringify(students, null, 2));
}

run();
