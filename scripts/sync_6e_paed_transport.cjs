const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '8aeaeed2-e475-4c54-9245-69228e5fcc52';

const flagsData = [
  // registration, paed, transport
  ["2671253", false, true],
  ["2671433", false, true],
  ["2421444", false, true],
  ["2671845", false, false],
  ["2673453", false, false],
  ["2673457", false, false],
  ["2673503", false, false],
  ["2313125", false, false],
  ["2674904", false, false],
  ["2290250", false, false],
  ["2681047", true, false],
  ["2686851", false, false],
  ["2297923", false, true],
  ["2478383", false, true],
  ["2693387", false, false],
  ["2693480", false, false],
  ["2693981", false, false],
  ["2694555", false, false],
  ["2338717", false, false],
  ["2350612", false, false],
  ["2421264", false, true],
  ["2315761", false, true],
  ["2671297", false, true],
  ["2277854", false, false],
  ["2312384", false, false],
  ["2569399", false, true],
  ["2309740", false, false],
  ["2721632", false, false],
  ["2721826", true, true],
  ["2725279", true, false],
  ["2349428", false, false]
];

async function syncFlags() {
  console.log('--- ATUALIZANDO PAED E TRANSPORTE 6\u00ba ANO E ---');
  let count = 0;

  for (const [reg, paed, transport] of flagsData) {
    const { error: studentErr } = await supabase
      .from('students')
      .update({
        paed: paed,
        school_transport: transport
      })
      .eq('registration_number', reg);

    if (studentErr) {
      console.error(`\u274c Erro no aluno ${reg}:`, studentErr.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  // Handle Transferred Student: YZANNI YONARA RIBEIRO DE SOUZA (2309740)
  console.log('\n\n--- AJUSTANDO STATUS DE ALUNO TRANSFERIDO ---');
  const regTransferred = "2309740";
  const { data: student } = await supabase.from('students').select('id').eq('registration_number', regTransferred).single();
  
  if (student) {
    await supabase.from('students').update({ status: 'TRANSFERIDO' }).eq('id', student.id);
    await supabase.from('enrollments')
      .update({ 
        status: 'TRANSFERIDO',
        adjustment_date: '2026-03-27'
      })
      .eq('student_id', student.id)
      .eq('classroom_id', classroomId);
    console.log(`\u2705 Yzanni Yonara (2309740) marcada como TRANSFERIDA em 27/03/2026.`);
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados.`);
}

syncFlags();
