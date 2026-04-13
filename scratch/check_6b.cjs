const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('students(name, registration_number, paed, school_transport)')
    .eq('classroom_id', 'e3707ca3-d72d-473d-a072-afaa2d616906');
  
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
