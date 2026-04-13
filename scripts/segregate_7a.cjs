const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function segregate() {
  console.log('--- INICIANDO DIAGNÓSTICO PROFUNDO 7º ANO ---');

  // 1. Localizar TODAS as salas de 7º Ano
  const { data: classes, error: ce } = await supabase.from('classrooms').select('id, name').ilike('name', '7º%');
  if (ce || !classes) {
    console.log('Erro ao buscar salas:', ce?.message);
    return;
  }

  const reports = [];
  for (const c of classes) {
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', c.id);
    reports.push({ name: c.name, id: c.id, count: count });
  }

  console.log('RELATÓRIO DE OCUPAÇÃO:');
  console.table(reports);

  // 2. Analisar o 7º Ano A (o que tem 131 alunos)
  const main7A = reports.find(r => r.name === '7º ANO A' && r.count > 50);
  if (!main7A) {
    console.log('Não foi possível identificar a sala 7A com duplicidade crítica.');
    return;
  }

  // Verificar se há alunos no 7A que JÁ ESTÃO em outras salas (7B, 7C etc)
  const { data: en7A } = await supabase.from('enrollments').select('student_id, students(name)').eq('classroom_id', main7A.id);
  
  const studentIdsIn7A = en7A.map(e => e.student_id);
  const duplicatesAcrossClasses = [];

  for (const c of reports) {
    if (c.id === main7A.id) continue;
    const { data: enOther } = await supabase.from('enrollments').select('student_id').eq('classroom_id', c.id);
    const idsOther = enOther.map(e => e.student_id);
    
    const overlap = studentIdsIn7A.filter(id => idsOther.includes(id));
    if (overlap.length > 0) {
      duplicatesAcrossClasses.push({ class: c.name, count: overlap.length });
    }
  }

  console.log('SOBREPOSIÇÃO ENTRE TURMAS:');
  console.table(duplicatesAcrossClasses);

  console.log('--- FIM DO DIAGNÓSTICO ---');
}

segregate();
