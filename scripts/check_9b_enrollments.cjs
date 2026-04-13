const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check9B() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(registration_number, name)')
    .eq('classroom_id', 'c4151923-5eba-4ef9-a989-a0d8e66658c5');

  if (error) console.error(error);
  console.log(`Students in 9B: ${data?.length || 0}`);
}

check9B();
