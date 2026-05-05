const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function list() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('status, students(id, name, registration_number)')
    .eq('classroom_id', '51adb22f-63ae-4f17-9970-edd91220ad8e');

  if (error) {
    console.error(error);
    return;
  }

  console.log('Total students in DB for 8B:', data.length);
  data.forEach(e => {
    if (e.students) {
      console.log(`${e.students.registration_number} | ${e.students.name} | ${e.status}`);
    } else {
      console.log('NULL STUDENT for enrollment:', e);
    }
  });
}

list();
