const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list9C() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(registration_number, name)')
    .eq('classroom_id', 'e77718aa-af6c-4a4e-a243-372df483166a');

  if (error) console.error(error);
  data.forEach(e => console.log(`${e.students?.registration_number} | ${e.students?.name}`));
}

list9C();
