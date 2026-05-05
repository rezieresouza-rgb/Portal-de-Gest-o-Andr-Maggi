const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('status, students(id, name, registration_number)')
    .eq('classroom_id', 'c4151923-5eba-4ef9-a989-a0d8e66658c5');

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
