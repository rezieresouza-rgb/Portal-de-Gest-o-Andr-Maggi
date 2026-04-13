const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b'; // 7º ANO B

const updateData = [
  { reg: "2207901", paed: false, transport: false },
  { reg: "2603175", paed: false, transport: false },
  { reg: "2581604", paed: true, transport: false },
  { reg: "2243588", paed: false, transport: false },
  { reg: "2648005", paed: false, transport: false },
  { reg: "2210228", paed: true, transport: false },
  { reg: "2586548", paed: false, transport: false },
  { reg: "2208354", paed: false, transport: false },
  { reg: "2623156", paed: false, transport: false },
  { reg: "2603223", paed: false, transport: false },
  { reg: "2584687", paed: false, transport: false },
  { reg: "2149607", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-02-19' },
  { reg: "2600821", paed: false, transport: false },
  { reg: "2584780", paed: false, transport: false },
  { reg: "2214165", paed: false, transport: false },
  { reg: "2584978", paed: false, transport: false },
  { reg: "2645141", paed: false, transport: false },
  { reg: "2405268", paed: false, transport: false },
  { reg: "2338472", paed: false, transport: false },
  { reg: "2417540", paed: false, transport: false },
  { reg: "2240478", paed: false, transport: false },
  { reg: "2581600", paed: false, transport: false },
  { reg: "2248251", paed: true, transport: false },
  { reg: "2348898", paed: false, transport: false },
  { reg: "2587454", paed: false, transport: false },
  { reg: "2207895", paed: false, transport: false },
  { reg: "2600560", paed: false, transport: false },
  { reg: "2652310", paed: false, transport: false },
  { reg: "2600464", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-03-20' }
];

async function sync7B() {
  console.log('--- ATUALIZANDO TURMA 7\u00ba ANO B ---');
  let count = 0;

  for (const item of updateData) {
    const { data: student } = await supabase.from('students').select('id').eq('registration_number', item.reg).single();
    
    if (!student) {
      console.error(`\u274c Aluno n\u00e3o encontrado: ${item.reg}`);
      continue;
    }

    // 1. Update Student Basic Info
    const stdUpdate = {
      paed: item.paed,
      school_transport: item.transport
    };
    if (item.status) stdUpdate.status = item.status;

    await supabase.from('students').update(stdUpdate).eq('id', student.id);

    // 2. Update Enrollment Status/Adjustment if transferred
    if (item.status === 'TRANSFERIDO') {
      await supabase.from('enrollments')
        .update({ 
          status: 'TRANSFERIDO',
          adjustment_date: item.adjustDate
        })
        .eq('student_id', student.id)
        .eq('classroom_id', classroomId);
      console.log(`\u2705 Aluno ${item.reg} marcado como TRANSFERIDO em ${item.adjustDate}.`);
    }

    process.stdout.write('.');
    count++;
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos do 7\u00ba B atualizados.`);
}

sync7B();
