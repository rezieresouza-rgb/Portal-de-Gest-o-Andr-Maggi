const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'e20aaa1c-a24c-4d8c-bcfb-00b795db10b5'; // 8º ANO D

const flagData = [
  { reg: "2515838", paed: false, transport: false },
  { reg: "2517885", paed: false, transport: false },
  { reg: "2139704", paed: false, transport: true },
  { reg: "2048417", paed: false, transport: false },
  { reg: "2422873", paed: false, transport: true },
  { reg: "2137232", paed: false, transport: false },
  { reg: "2517888", paed: false, transport: false },
  { reg: "2517931", paed: false, transport: true },
  { reg: "2517919", paed: false, transport: true },
  { reg: "2552429", paed: false, transport: true },
  { reg: "2426271", paed: false, transport: false },
  { reg: "2522608", paed: false, transport: true },
  { reg: "2439134", paed: false, transport: false },
  { reg: "2137172", paed: true, transport: false },
  { reg: "2167924", paed: false, transport: false },
  { reg: "2168508", paed: false, transport: true },
  { reg: "2137743", paed: false, transport: false },
  { reg: "2560541", paed: false, transport: false },
  { reg: "2137196", paed: false, transport: true },
  { reg: "2532702", paed: false, transport: false },
  { reg: "2157475", paed: false, transport: false },
  { reg: "2166695", paed: false, transport: false },
  { reg: "2290273", paed: false, transport: false },
  { reg: "2422343", paed: false, transport: false },
  { reg: "2153149", paed: false, transport: true },
  { reg: "2524647", paed: false, transport: true },
  { reg: "2131934", paed: false, transport: false },
  { reg: "2330432", paed: false, transport: false },
  { reg: "2160248", paed: false, transport: true },
  { reg: "2517940", paed: false, transport: false }
];

async function syncFlags() {
  console.log('--- ATUALIZANDO FLAGS PAED/TRANSPORTE 8\u00ba ANO D ---');
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
        status: 'ATIVO'
      })
      .eq('id', student.id);

    if (updateStudentError) {
      console.error(`\u274c Erro ao atualizar flags do aluno ${s.reg}:`, updateStudentError.message);
      continue;
    }

    // 3. Update enrollment status (ensuring Active)
    const { error: updateEnrollError } = await supabase
      .from('enrollments')
      .update({ status: 'ATIVO' })
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
