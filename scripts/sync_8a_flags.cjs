const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '69d73c72-65a3-441e-9bd6-14b6e923309d'; // 8º ANO A

const flagData = [
  { reg: "2538543", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-03-02' },
  { reg: "2137410", paed: false, transport: false },
  { reg: "2522551", paed: false, transport: false },
  { reg: "2517846", paed: false, transport: false },
  { reg: "2136684", paed: true, transport: false },
  { reg: "2168493", paed: false, transport: false },
  { reg: "2645898", paed: false, transport: false },
  { reg: "2288971", paed: false, transport: false },
  { reg: "2536878", paed: false, transport: false },
  { reg: "2137918", paed: false, transport: false },
  { reg: "2250607", paed: false, transport: false },
  { reg: "2517841", paed: false, transport: false },
  { reg: "2136598", paed: false, transport: false },
  { reg: "2522390", paed: false, transport: false },
  { reg: "2517807", paed: false, transport: false },
  { reg: "2406028", paed: false, transport: false },
  { reg: "491301", paed: false, transport: false },
  { reg: "2151057", paed: false, transport: false },
  { reg: "2464953", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-03-23' },
  { reg: "2136789", paed: false, transport: false },
  { reg: "2137101", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-04-02' },
  { reg: "2523030", paed: false, transport: false },
  { reg: "2517936", paed: false, transport: false },
  { reg: "2069781", paed: false, transport: false },
  { reg: "2050585", paed: false, transport: false }
];

async function syncFlags() {
  console.log('--- ATUALIZANDO FLAGS PAED/TRANSPORTE 8\u00ba ANO A ---');
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
