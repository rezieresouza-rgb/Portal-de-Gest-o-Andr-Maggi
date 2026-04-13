const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(name, registration_number, paed, school_transport)')
    .eq('classroom_id', 'b514754e-5c4c-4e37-bb4b-aa445428fcf8');
  
  if (error) {
    console.error(error);
    return;
  }

  data.forEach(d => {
    if (d.students) {
      console.log(`${d.students.name}|${d.students.registration_number}|${d.students.paed}|${d.students.school_transport}`);
    }
  });
}

check();
