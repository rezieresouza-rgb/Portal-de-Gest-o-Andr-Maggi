const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteStudent() {
  const code = '2343081';

  // Find the student
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id, name, registration_number')
    .eq('registration_number', code);

  if (fetchError) {
    console.error('Error fetching student:', fetchError);
    return;
  }

  if (!students || students.length === 0) {
    console.log('Student not found with code:', code);
    return;
  }

  for (const student of students) {
    console.log('Found student:', student);
    const studentId = student.id;

    // Delete from related tables to avoid foreign key constraints
    await supabase.from('enrollments').delete().eq('student_id', studentId);
    await supabase.from('attendance').delete().eq('student_id', studentId);
    await supabase.from('student_grades').delete().eq('student_id', studentId);
    await supabase.from('incidents').delete().eq('student_id', studentId);
    await supabase.from('student_movements').delete().eq('student_id', studentId);
    await supabase.from('occurrences').delete().eq('student_id', studentId);
    await supabase.from('active_search_actions').delete().eq('student_id', studentId);
    await supabase.from('active_searches').delete().eq('student_id', studentId);

    // Finally delete from students
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    console.log(`Deleted student ${student.name}:`, data, error);
  }
}

deleteStudent();
