const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '51adb22f-63ae-4f17-9970-edd91220ad8e'; // 8º ANO B

const flagData = [
  { reg: "2235168", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-09' },
  { reg: "2270899", paed: false, transport: false },
  { reg: "2166814", paed: true, transport: false },
  { reg: "2197774", paed: false, transport: false },
  { reg: "2659835", paed: false, transport: false },
  { reg: "1977590", paed: true, transport: false },
  { reg: "2364199", paed: false, transport: false },
  { reg: "2136816", paed: false, transport: false },
  { reg: "2151648", paed: false, transport: false },
  { reg: "2136664", paed: false, transport: false },
  { reg: "2538192", paed: false, transport: false },
  { reg: "2526597", paed: false, transport: false },
  { reg: "2137183", paed: false, transport: false },
  { reg: "2137589", paed: false, transport: false },
  { reg: "2137425", paed: false, transport: false },
  { reg: "2623273", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-12' },
  { reg: "2632831", paed: false, transport: false },
  { reg: "2137484", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-18' },
  { reg: "2137142", paed: false, transport: false },
  { reg: "2031995", paed: false, transport: false },
  { reg: "2163564", paed: false, transport: false },
  { reg: "2522483", paed: false, transport: false },
  { reg: "2534878", paed: false, transport: false },
  { reg: "2136648", paed: false, transport: false },
  { reg: "2523836", paed: false, transport: false },
  { reg: "2651767", paed: false, transport: false },
  { reg: "2545654", paed: false, transport: false },
  { reg: "2519067", paed: false, transport: false },
  { reg: "2412301", paed: false, transport: false }
];

async function syncFlags() {
  console.log('--- ATUALIZANDO FLAGS PAED/TRANSPORTE 8\u00ba ANO B ---');
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
