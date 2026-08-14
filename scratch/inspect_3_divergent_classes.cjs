const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect3Classes() {
  const targetClasses = ['7º ANO D', '8º ANO E', '9º ANO B'];

  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('*')
    .in('name', targetClasses);

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, student:students(*), classroom:classrooms(*)')
    .in('classroom_id', classrooms.map(c => c.id));

  const { data: students } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))');

  console.log("=== ANÁLISE DOS ALUNOS NAS 3 TURMAS RESTANDO DIVERGÊNCIA ===\n");

  classrooms.forEach(cls => {
    const secEnr = enrollments.filter(e => e.classroom_id === cls.id && (e.status === 'ATIVO' || e.status === 'RECLASSIFICADO' || e.status === 'MATRICULADO' || e.status === 'CURSANDO'));
    
    secEnr.forEach(e => {
      const s = students.find(st => st.id === e.student_id);
      const allSLogs = s.enrollments || [];

      console.log(`\nAluno: ${s.name} (Matrícula: ${s.registration_number}) | Turma Secretaria: ${cls.name}`);
      console.log(` - Matrículas registradas para o aluno (${allSLogs.length}):`);
      allSLogs.forEach(en => {
        console.log(`    * Status: '${en.status}' | Turma: '${en.classrooms?.name}' | Criado em: ${en.created_at}`);
      });
    });
  });
}

inspect3Classes();
