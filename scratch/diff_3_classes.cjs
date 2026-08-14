const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diff3Classes() {
  const targetClasses = ['7º ANO D', '8º ANO A', '8º ANO E'];

  const { data: dbClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .in('name', targetClasses);

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, student:students(*), classroom:classrooms(*)');

  const { data: dbStudents } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))');

  targetClasses.forEach(cName => {
    const cls = dbClassrooms.find(c => c.name === cName);
    const secEnr = enrollments.filter(e => e.classroom_id === cls.id && (e.status === 'ATIVO' || e.status === 'RECLASSIFICADO' || e.status === 'MATRICULADO' || e.status === 'CURSANDO'));
    
    console.log(`\n==================================================`);
    console.log(`🏫 TURMA: ${cName}`);
    console.log(`==================================================`);
    console.log(`Alunos Ativos no Banco/Secretaria (${secEnr.length}):`);
    
    secEnr.forEach(e => {
      const s = dbStudents.find(st => st.id === e.student_id);
      const activeEnr = 
        s.enrollments?.find((en) => en.status === 'ATIVO') ||
        s.enrollments?.find((en) => en.status === 'MATRICULADO' || en.status === 'CURSANDO') ||
        s.enrollments?.find((en) => en.status === 'RECLASSIFICADO');

      const isSameClass = activeEnr?.classrooms?.name === cName;
      if (!isSameClass) {
        console.log(` ⚠️ DIVERGÊNCIA DE ALUNO: ${s.name} (Matrícula: ${s.registration_number})`);
        console.log(`    - Na Secretaria está na turma: ${cName} (Status no vínculo: '${e.status}')`);
        console.log(`    - Todos os vínculos deste aluno no banco:`);
        s.enrollments?.forEach(en => {
          console.log(`      * Status: '${en.status}' | Turma: '${en.classrooms?.name}'`);
        });
      }
    });
  });
}

diff3Classes();
