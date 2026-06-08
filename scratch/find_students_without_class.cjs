const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findStudentsWithoutClass() {
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      registration_number,
      status,
      enrollments (
        id,
        status,
        classroom_id,
        classrooms ( name )
      )
    `)
    .eq('status', 'ATIVO');

  if (error) {
    console.error('Error fetching students:', error);
    return;
  }

  // A student is without a class if they have NO active enrollment
  const withoutClass = students.filter(student => {
    // Check if there is any active enrollment that has a classroom
    const activeEnrollments = student.enrollments ? student.enrollments.filter(e => e.status === 'ATIVO' && e.classroom_id) : [];
    return activeEnrollments.length === 0;
  });

  console.log(`Encontrados ${withoutClass.length} alunos ATIVOS sem turma.`);
  withoutClass.forEach(s => {
    console.log(`- Matrícula: ${s.registration_number || 'S/N'} | Nome: ${s.name}`);
  });
}

findStudentsWithoutClass();
