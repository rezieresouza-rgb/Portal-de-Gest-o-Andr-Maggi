const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: classrooms } = await supabase.from('classrooms').select('id').eq('name', '7º ANO A');
  if (!classrooms || classrooms.length === 0) {
      console.log("Classroom not found");
      return;
  }
  const classroomId = classrooms[0].id;

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('students(name, registration_number)')
    .eq('classroom_id', classroomId)
    .in('status', ['ATIVO', 'RECLASSIFICADO']);

  const names = enrollments.map(e => ({ name: e.students.name, reg: e.students.registration_number }));
  names.sort((a, b) => a.name.localeCompare(b.name));
  
  names.forEach((n, idx) => {
      console.log(`${idx + 1}. ${n.name} (${n.reg})`);
  });
}

check();
