const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteStudent() {
  const studentId = '4b36f4a9-4d4f-4a8c-85e0-0cb9f403628f';

  // Delete from enrollments if it exists to avoid foreign key constraint error
  await supabase.from('enrollments').delete().eq('student_id', studentId);

  // Delete from attendances if any
  await supabase.from('attendance').delete().eq('student_id', studentId);
  await supabase.from('student_grades').delete().eq('student_id', studentId);
  await supabase.from('incidents').delete().eq('student_id', studentId);
  await supabase.from('student_movements').delete().eq('student_id', studentId);

  const { data, error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);
    
  console.log('Delete result:', data, error);
}

deleteStudent();
