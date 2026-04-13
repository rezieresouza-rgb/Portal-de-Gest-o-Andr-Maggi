const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '51adb22f-63ae-4f17-9970-edd91220ad8e'; // 8º ANO B

const studentsData = [
  { reg: "2235168", name: "ALEX EMANUEL PAIXÃO SILVA", gender: "MASCULINO", birth: "2012-10-31", enrollment: "2026-01-19" },
  { reg: "2270899", name: "ANA CLARA FIEL BRITO", gender: "FEMININO", birth: "2013-02-02", enrollment: "2026-01-19" },
  { reg: "2519067", name: "ARTHUR MANOEL GONÇALVES BRANCO", gender: "MASCULINO", birth: "2012-08-10", enrollment: "2026-02-02" },
  { reg: "2166814", name: "DERICK ENRIQUE GUIMARÃES AUGUSTO", gender: "MASCULINO", birth: "2013-01-17", enrollment: "2026-01-19" },
  { reg: "2197774", name: "EMANOEL DUARTE VIANA", gender: "MASCULINO", birth: "2012-05-30", enrollment: "2026-01-19" },
  { reg: "2659835", name: "FABTIELLI VITÓRIA GONÇALVES COTTEVIQUES", gender: "FEMININO", birth: "2010-09-11", enrollment: "2026-01-19" },
  { reg: "1977590", name: "FELIPE PEREIRA VIEIRA", gender: "MASCULINO", birth: "2011-04-02", enrollment: "2026-01-19" },
  { reg: "2364199", name: "FERNANDA LOPES PEREIRA", gender: "FEMININO", birth: "2012-12-27", enrollment: "2026-01-19" },
  { reg: "2136816", name: "IZABELI SOARES CARON", gender: "FEMININO", birth: "2013-04-10", enrollment: "2026-01-19" },
  { reg: "2151648", name: "KAMILI DA SILVA SOUZA", gender: "FEMININO", birth: "2011-12-29", enrollment: "2026-01-19" },
  { reg: "2136664", name: "KARLLOS MIGUEL PONCIO GOMES", gender: "MASCULINO", birth: "2013-02-25", enrollment: "2026-01-19" },
  { reg: "2538192", name: "KETTLYN VITÓRIA TEIXEIRA RODRIGUES", gender: "FEMININO", birth: "2012-05-08", enrollment: "2026-01-19" },
  { reg: "2526597", name: "LAURA BEATRYZ JUNQUEIRA PASCOAL", gender: "FEMININO", birth: "2013-01-25", enrollment: "2026-01-19" },
  { reg: "2137183", name: "LETYCIA MARIA PAÇOS DA SILVA", gender: "FEMININO", birth: "2013-01-20", enrollment: "2026-01-19" },
  { reg: "2651767", name: "LUAN BARBOSA MOREIRA", gender: "MASCULINO", birth: "2012-02-22", enrollment: "2026-01-19" },
  { reg: "2137589", name: "LUCAS ALEXSSANDRO PEREIRA DE ASSIS", gender: "MASCULINO", birth: "2012-09-11", enrollment: "2026-01-19" },
  { reg: "2137425", name: "LUIZ ANTONIO PINTO DE FREITAS", gender: "MASCULINO", birth: "2012-04-03", enrollment: "2026-01-19" },
  { reg: "2623273", name: "LUIZA EMANUELY MARQUES ALMEIDA", gender: "FEMININO", birth: "2013-01-08", enrollment: "2026-01-19" },
  { reg: "2632831", name: "MAIKEL COUTLEM DO NASCIMENTO MENDES", gender: "MASCULINO", birth: "2013-02-19", enrollment: "2026-01-19" },
  { reg: "2545654", name: "MARIANA LEAL", gender: "FEMININO", birth: "2012-04-10", enrollment: "2026-01-19" },
  { reg: "2137484", name: "MATEUS CAMARGO RODRIGUES", gender: "MASCULINO", birth: "2012-11-08", enrollment: "2026-01-19" },
  { reg: "2137142", name: "NATHALIA NASCIMENTO MARANHÃO", gender: "FEMININO", birth: "2012-12-13", enrollment: "2026-01-19" },
  { reg: "2031995", name: "PABLO DA SILVA OLIVEIRA", gender: "MASCULINO", birth: "2011-04-18", enrollment: "2026-01-19" },
  { reg: "2163564", name: "PATRICK RYAN FERREIRA DOS SANTOS", gender: "MASCULINO", birth: "2012-08-11", enrollment: "2026-01-19" },
  { reg: "2522483", name: "PAULO VITHOR DE SOUZA LIMA", gender: "MASCULINO", birth: "2012-07-11", enrollment: "2026-01-19" },
  { reg: "2534878", name: "PEDRO MYGUELL SILVA BRITO", gender: "MASCULINO", birth: "2011-09-05", enrollment: "2026-01-19" },
  { reg: "2136648", name: "THALLYS NEVES DE OLIVEIRA", gender: "MASCULINO", birth: "2013-03-21", enrollment: "2026-01-19" },
  { reg: "2523836", name: "VINICIUS COSER DE JESUS", gender: "MASCULINO", birth: "2012-05-01", enrollment: "2026-01-19" },
  { reg: "2412301", name: "NATALI VITORIA NOVAIS", gender: "FEMININO", birth: "2012-12-21", enrollment: "2026-03-19" }
];

async function sync8B() {
  console.log('--- INICIANDO SINCRONIZACAO 8\u00ba ANO B (BIOGRAFIA) ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let count = 0;

  for (const s of studentsData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Upsert Student core info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        gender: s.gender,
        birth_date: s.birth,
        status: 'ATIVO'
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.log(`\u274c ERRO: ${studentError.message}`);
      continue;
    }

    // 2. Upsert Enrollment
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: student.id,
        classroom_id: classroomId,
        enrollment_date: s.enrollment,
        status: 'ATIVO'
      }, { onConflict: 'student_id,classroom_id' });

    if (enrollError) {
      console.log(`\u274c ERRO MATR\u00cdCULA: ${enrollError.message}`);
    } else {
      console.log('OK');
      count++;
    }
  }

  // 3. Cleanup
  console.log('\n--- LIMPANDO MATR\u00cdCULAS ANTIGAS ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 8B...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync8B().catch(err => console.error('ERRO FATAL:', err));
