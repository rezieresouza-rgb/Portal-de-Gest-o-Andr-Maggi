const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clean7A() {
  const classId = '69d73c72-65a3-448a-adc1-715764dca671';
  console.log('Iniciando análise profunda da Turma 7º Ano A...');

  const { data: en, error } = await supabase.from('enrollments')
    .select('id, student_id, students(name, registration_number)')
    .eq('classroom_id', classId);

  if (error) {
    console.error('Erro ao buscar enturmações:', error.message);
    return;
  }

  const studentMap = {};
  const toDelete = [];

  for (const entry of en) {
    if (!entry.students) continue;
    const studentName = entry.students.name;
    const studentId = entry.student_id;

    if (!studentMap[studentName]) {
      studentMap[studentName] = { id: studentId, enrollments: [entry.id] };
    } else {
      // Já existe esse nome na lista para esta sala
      console.log(`Deduplicando: ${studentName}`);
      toDelete.push(entry.id);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Removendo ${toDelete.length} entradas duplicadas no 7º Ano A...`);
    const { error: delError } = await supabase.from('enrollments').delete().in('id', toDelete);
    if (delError) console.error('Erro na remoção:', delError.message);
    else console.log('LIMPEZA CONCLUÍDA COM SUCESSO!');
  } else {
    console.log('Nenhuma duplicidade encontrada na enturmação do 7º Ano A.');
  }
}

clean7A();
