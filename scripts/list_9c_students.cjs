const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('status, students(id, name, registration_number)')
    .eq('classroom_id', 'e77718aa-af6c-4a4e-a243-372df483166a');

  if (error) {
    console.error(error);
    return;
  }

  console.log('Total in DB:', data.length);
  data.forEach(e => {
    if (e.students) {
      console.log(`${e.students.registration_number} | ${e.students.name} | ${e.status}`);
    }
  });
}

list();
