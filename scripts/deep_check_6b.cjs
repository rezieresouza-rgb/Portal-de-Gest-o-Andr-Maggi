const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deepCheck6B() {
  console.log("=== Deep Check 6º ANO B ===");
  
  const { data: classrooms } = await supabase.from('classrooms').select('id').eq('name', '6º ANO B');
  const classroomId = classrooms[0].id;

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      status,
      enrollment_date,
      student_id,
      students (
        name,
        registration_number
      )
    `)
    .eq('classroom_id', classroomId)
    .in('status', ['ATIVO', 'RECLASSIFICADO']);

  console.log(`Active enrollments in 6B: ${enrollments.length}`);
  
  const studentIds = enrollments.map(e => e.student_id);

  // Get ALL enrollments for these students
  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select(`
      status,
      enrollment_date,
      student_id,
      classrooms (name)
    `)
    .in('student_id', studentIds);

  enrollments.sort((a, b) => a.students.name.localeCompare(b.students.name)).forEach((e, idx) => {
    const studentHistory = allEnrollments.filter(ae => ae.student_id === e.student_id);
    console.log(`${idx + 1}. ${e.students.name} (${e.students.registration_number})`);
    studentHistory.forEach(h => {
      console.log(`   - [${h.status}] in ${h.classrooms?.name} (${h.enrollment_date})`);
    });
  });
}

deepCheck6B();
