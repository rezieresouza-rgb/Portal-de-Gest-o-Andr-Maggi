const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check9D() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(registration_number, name)')
    .eq('classroom_id', '6126c0dd-efbf-478b-9e61-4353af06ae5a');

  if (error) console.error(error);
  console.log(`Students in 9D: ${data?.length || 0}`);
}

check9D();
