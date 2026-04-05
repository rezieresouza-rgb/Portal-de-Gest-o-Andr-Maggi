const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Matrículas oficiais do SIGEEDUCA para o 6º ANO E
const official6E = new Set([
  "2671263","2671633","3421444","2971945","2675483","2676657","3073603","2310125",
  "2879304","2290250","2697017","3068981","2297023","2475383","2093087","3093380",
  "3626581","3004352","2336717","2390012","3052584","2116781","2671307","2277854",
  "2312384","3546989","3069260","2727020","2731926","2735279"
]);

async function cleanup() {
  const { data: classroom } = await supabase.from('classrooms').select('id').eq('name','6\u00ba ANO E').single();
  if (!classroom) return console.error('Turma 6E não encontrada');

  // Buscar todos os enrollments do 6E com dados do aluno
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, student_id, students(registration_number, name)')
    .eq('classroom_id', classroom.id);

  console.log(`Total encontrado: ${enrollments?.length}\n`);

  // Separar: oficiais vs extras
  const toKeep = [];
  const toDelete = [];
  const seen = new Set();

  // Para cada aluno, manter apenas 1 enrollment
  for (const e of enrollments || []) {
    const reg = e.students?.registration_number;
    const isOfficial = official6E.has(reg);

    if (!isOfficial) {
      // Aluno não está na lista oficial — remover enrollment do 6E
      toDelete.push(e);
    } else if (seen.has(reg)) {
      // Duplicata — remover
      toDelete.push(e);
    } else {
      seen.add(reg);
      toKeep.push(e);
    }
  }

  console.log(`Manter: ${toKeep.length} | Remover: ${toDelete.length}`);

  if (toDelete.length > 0) {
    console.log('\nRemovendo enrollments extras...');
    for (const e of toDelete) {
      const { error } = await supabase.from('enrollments').delete().eq('id', e.id);
      if (error) console.error(' ERR:', e.students?.name, error.message);
      else process.stdout.write(` OK: removido enrollment de ${e.students?.name} [${e.students?.registration_number}]\n`);
    }
  }

  // Verificação final
  const { data: final } = await supabase
    .from('enrollments')
    .select('students(name,registration_number)')
    .eq('classroom_id', classroom.id);

  console.log(`\n✅ Total final no 6E: ${final?.length}`);

  // Verificar se faltou algum oficial
  const presentRegs = new Set(final?.map((e) => e.students?.registration_number));
  const missing = [...official6E].filter(r => !presentRegs.has(r));
  if (missing.length > 0) {
    console.log('⚠️  Matrículas ausentes:', missing.join(', '));
  } else {
    console.log('✅ Todos os 30 alunos oficiais presentes!');
  }
}

cleanup().catch(e => console.error('FATAL:', e.message));
