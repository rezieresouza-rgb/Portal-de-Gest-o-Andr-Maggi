require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('class_attendance_students')
    .select(`
      student_id,
      student_name,
      is_present,
      attendance_record_id
    `)
    .eq('is_present', false)
    .limit(10);

  console.log('Sample absent records:', data?.length, 'error:', error?.message);

  const { data: joinData, error: joinError } = await supabase
    .from('class_attendance_students')
    .select(`
      student_id,
      student_name,
      is_present,
      class_attendance_records (
        date,
        classroom_name
      )
    `)
    .eq('is_present', false)
    .limit(5);

  console.log('Join with class_attendance_records:', joinData?.length, 'error:', joinError?.message);

  const { data: studsJoin, error: studsError } = await supabase
    .from('class_attendance_students')
    .select(`
      student_id,
      student_name,
      students (
        contact_phone
      )
    `)
    .limit(5);

  console.log('Join with students:', studsJoin?.length, 'error:', studsError?.message);
}

test();
