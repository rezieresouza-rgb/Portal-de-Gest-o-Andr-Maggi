const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list9B() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(registration_number, name)')
    .eq('classroom_id', 'c4151923-5eba-4ef9-a989-a0d8e66658c5');

  if (error) console.error(error);
  data.forEach(e => console.log(`${e.students?.registration_number} | ${e.students?.name}`));
}

list9B();
