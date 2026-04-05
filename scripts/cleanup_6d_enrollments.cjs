const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Lista OFICIAL da turma 6D (do SIGEEDUCA)
const official6D = [
  "3960119", "3960138", "3960214", "2966259", "2966206", "2966084",
  "3965431", "2965427", "2997251", "2997220", "2267110", "2269305",
  "2369004", "2323401", "2228763", "2969047", "3659083", "3369930",
  "2323714", "2326081", "2395807", "3671369", "2671365", "2671289",
  "2998402", "2289816", "2269319", "2719652", "2693188", "2326902",
];

(async () => {
  const { data: cls } = await supabase.from('classrooms').select('id').eq('name', '6º ANO D').single();
  if (!cls) return console.error('Turma 6D não encontrada');
  console.log('6D ID:', cls.id);

  // Buscar todos os enrollments da turma
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, student_id, students(name, registration_number)')
    .eq('classroom_id', cls.id);

  console.log('Total de enrollments no 6D:', enrollments?.length);

  // Identificar quais devem ser removidos (não estão na lista oficial)
  const toRemove = [];
  const toKeep = [];

  for (const e of (enrollments || [])) {
    const reg = e.students?.registration_number;
    if (!reg || !official6D.includes(reg)) {
      toRemove.push({ id: e.id, name: e.students?.name, reg });
    } else {
      toKeep.push({ id: e.id, name: e.students?.name, reg });
    }
  }

  console.log('\nManter:', toKeep.length, 'alunos');
  console.log('Remover:', toRemove.length, 'registros extras');

  if (toRemove.length > 0) {
    console.log('\nRemovendo extras:');
    for (const r of toRemove) {
      console.log('  - Removendo:', r.reg, r.name);
      const { error } = await supabase.from('enrollments').delete().eq('id', r.id);
      if (error) console.error('    Erro:', error.message);
      else console.log('    OK');
    }
  }

  // Verificação final
  const { count } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact' })
    .eq('classroom_id', cls.id);

  console.log('\nTotal final no 6D:', count);
})().catch(e => console.error(e.message));
