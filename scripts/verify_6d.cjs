const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  // Buscar todas as turmas 6D
  const { data: classes } = await supabase.from('classrooms').select('id, name').ilike('name', '%6%D%');
  console.log('Turmas 6D encontradas:', JSON.stringify(classes));

  // Contar enrollments por turma
  for (const cls of (classes || [])) {
    const { data, count } = await supabase
      .from('enrollments')
      .select('id, student_id, students(name, registration_number)', { count: 'exact' })
      .eq('classroom_id', cls.id);
    console.log(`\nTurma: ${cls.name} (${cls.id}) - Total: ${count}`);
    if (data) {
      data.sort((a,b)=>(a.students?.name||'').localeCompare(b.students?.name||''))
          .forEach((e,i) => {
            if(e.students) console.log(`  ${i+1}. ${e.students.registration_number} ${e.students.name}`);
          });
    }
  }
})().catch(e => console.error(e.message));
