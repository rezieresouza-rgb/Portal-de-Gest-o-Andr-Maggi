const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '61ee771d-c65d-4c1c-b608-2e736db324b3'; // 7º ANO D

const flagData = [
  { reg: "2580815", paed: false, transport: true },
  { reg: "2137069", paed: false, transport: false },
  { reg: "2601272", paed: true, transport: false },
  { reg: "2176526", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-03-20' },
  { reg: "2486770", paed: false, transport: true },
  { reg: "2308856", paed: false, transport: false },
  { reg: "2191657", paed: false, transport: true },
  { reg: "2589370", paed: false, transport: false },
  { reg: "2208534", paed: false, transport: false },
  { reg: "2614263", paed: false, transport: false },
  { reg: "2601462", paed: false, transport: false },
  { reg: "1974328", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-23' },
  { reg: "2601591", paed: false, transport: true },
  { reg: "2580615", paed: false, transport: false },
  { reg: "2599665", paed: false, transport: false },
  { reg: "2597818", paed: false, transport: true },
  { reg: "2208341", paed: true, transport: false },
  { reg: "2595500", paed: false, transport: true },
  { reg: "2244544", paed: false, transport: false },
  { reg: "2597303", paed: false, transport: false },
  { reg: "2246485", paed: false, transport: false },
  { reg: "2208561", paed: false, transport: false },
  { reg: "2239392", paed: false, transport: false },
  { reg: "2137209", paed: false, transport: false },
  { reg: "2599285", paed: true, transport: true },
  { reg: "2142305", paed: false, transport: false },
  { reg: "2207882", paed: false, transport: false },
  { reg: "2581467", paed: false, transport: false },
  { reg: "2048360", paed: true, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-18' }, // Reclassificado
  { reg: "2722366", paed: false, transport: false },
  { reg: "2731779", paed: true, transport: false }
];

async function syncFlags() {
  console.log('--- ATUALIZANDO FLAGS PAED/TRANSPORTE 7\u00ba ANO D ---');
  let count = 0;

  for (const s of flagData) {
    // 1. Get student ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', s.reg)
      .single();

    if (studentError || !student) {
      console.error(`\u274c Aluno ${s.reg} n\u00e3o encontrado.`);
      continue;
    }

    // 2. Update student flags
    const { error: updateStudentError } = await supabase
      .from('students')
      .update({
        paed: s.paed,
        school_transport: s.transport,
        status: s.status || 'ATIVO'
      })
      .eq('id', student.id);

    if (updateStudentError) {
      console.error(`\u274c Erro ao atualizar flags do aluno ${s.reg}:`, updateStudentError.message);
      continue;
    }

    // 3. Update enrollment status/date
    const { error: updateEnrollError } = await supabase
      .from('enrollments')
      .update({
        status: s.status || 'ATIVO',
        adjustment_date: s.adjustDate || null
      })
      .match({ student_id: student.id, classroom_id: classroomId });

    if (updateEnrollError) {
      console.error(`\u274c Erro ao atualizar matr\u00edcula do aluno ${s.reg}:`, updateEnrollError.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados com flags.`);
}

syncFlags();
