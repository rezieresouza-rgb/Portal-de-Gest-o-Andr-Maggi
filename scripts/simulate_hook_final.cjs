const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function simulate() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      enrollments (
        enrollment_date,
        adjustment_date,
        status,
        classrooms (name, shift)
      )
    `);

  if (error) {
    console.error(error);
    return;
  }

  const mappedStudents = data.map((s) => {
    const sortedEnrollments = [...(s.enrollments || [])].sort((a, b) => {
      const dateA = new Date(a.enrollment_date || 0).getTime();
      const dateB = new Date(b.enrollment_date || 0).getTime();
      
      const isActiveA = (a.status === 'ATIVO' || a.status === 'RECLASSIFICADO');
      const isActiveB = (b.status === 'ATIVO' || b.status === 'RECLASSIFICADO');
      
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      
      return dateB - dateA;
    });

    const enrollment = sortedEnrollments[0];
    const classroom = enrollment?.classrooms;
    
    return {
      id: s.id,
      name: s.name,
      class: classroom?.name || 'SEM TURMA',
      status: enrollment?.status || 'INATIVO'
    };
  });

  const selectedClass = '6º ANO B';
  const filtered = mappedStudents.filter((s) =>
    s.class.toUpperCase() === selectedClass.toUpperCase() && (s.status === 'ATIVO' || s.status === 'RECLASSIFICADO')
  );

  console.log(`Total mapped: ${mappedStudents.length}`);
  console.log(`Filtered for 6B: ${filtered.length}`);
  
  filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.name}`);
  });
}

simulate();
