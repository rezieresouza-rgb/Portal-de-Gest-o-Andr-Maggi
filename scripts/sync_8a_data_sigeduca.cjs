const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '69d73c72-65a3-441e-9bd6-14b6e923309d'; // 8º ANO A

const studentsData = [
  { reg: "2538543", name: "ALEXANDRE JUNIOR SANTOS AQUINO", gender: "MASCULINO", birth: "2013-04-15", enrollment: "2026-01-19" },
  { reg: "2137410", name: "AMANDA CARVALHO LUIZ", gender: "FEMININO", birth: "2012-08-23", enrollment: "2026-01-19" },
  { reg: "2522551", name: "ANDRÉ MENDES DE OLIVEIRA", gender: "MASCULINO", birth: "2012-11-23", enrollment: "2026-01-19" },
  { reg: "2517846", name: "ANTHONY MIGUEL ALVES DE MELO DUTRA", gender: "MASCULINO", birth: "2012-10-04", enrollment: "2026-01-19" },
  { reg: "2136684", name: "DANIELE GOMES DE BRITO MARQUES", gender: "FEMININO", birth: "2012-12-26", enrollment: "2026-01-19" },
  { reg: "2168493", name: "DIEGO DIONISIO TONIATO", gender: "MASCULINO", birth: "2012-05-28", enrollment: "2026-01-19" },
  { reg: "2645898", name: "DIOCIBET ASHLEY MACKENZIN PEREZ GUZMAN", gender: "FEMININO", birth: "2012-05-25", enrollment: "2026-01-19" },
  { reg: "2050585", name: "DOUGLAS GOMES DE BRITO", gender: "MASCULINO", birth: "2011-06-27", enrollment: "2026-01-19" },
  { reg: "2288971", name: "FABIANA ALANA FROIS SANITA", gender: "FEMININO", birth: "2012-06-17", enrollment: "2026-01-19" },
  { reg: "2536878", name: "GABRIELLY RODRIGUES PAZIM", gender: "FEMININO", birth: "2012-10-15", enrollment: "2026-01-19" },
  { reg: "2137918", name: "GABRYELLE DE OLIVEIRA ALVES", gender: "FEMININO", birth: "2012-06-30", enrollment: "2026-01-19" },
  { reg: "2250607", name: "GUSTAVO GONSALVES FERREIRA", gender: "MASCULINO", birth: "2012-12-10", enrollment: "2026-01-19" },
  { reg: "2517841", name: "HALLANA GABRIELLY DOS SANTOS CASTRO", gender: "FEMININO", birth: "2012-08-09", enrollment: "2026-01-19" },
  { reg: "2136598", name: "HELOIZA MANTOVANI DE OLIVEIRA", gender: "FEMININO", birth: "2013-02-04", enrollment: "2026-01-19" },
  { reg: "2522390", name: "JOÃO PAULO FIDELIS SOUZA", gender: "MASCULINO", birth: "2012-05-30", enrollment: "2026-01-19" },
  { reg: "2517807", name: "JOÃO VICTOR DA SILVA ALVES", gender: "MASCULINO", birth: "2012-11-29", enrollment: "2026-01-19" },
  { reg: "2069781", name: "KAUAN RAFAEL NUNES DA SILVA", gender: "MASCULINO", birth: "2011-07-14", enrollment: "2026-01-19" },
  { reg: "2406028", name: "LAUANE AMORIM WESTPHAL", gender: "FEMININO", birth: "2012-11-16", enrollment: "2026-01-19" },
  { reg: "491301", name: "LETICIA MARCIELLY AZEVEDO PEREIRA", gender: "FEMININO", birth: "2012-08-15", enrollment: "2026-01-19" },
  { reg: "2151057", name: "LUIS HENRIQUE LANGRAF DA SILVA", gender: "MASCULINO", birth: "2013-02-04", enrollment: "2026-01-19" },
  { reg: "2464953", name: "RAFFAELLA VITORYA GARCIA DOS SANTOS", gender: "FEMININO", birth: "2011-12-02", enrollment: "2026-01-19" },
  { reg: "2136789", name: "RAY CARLOS FERREIRA DOS SANTOS", gender: "MASCULINO", birth: "2013-01-09", enrollment: "2026-01-19" },
  { reg: "2137101", name: "VITOR GABRIEL DIAS PEREIRA", gender: "MASCULINO", birth: "2012-06-24", enrollment: "2026-01-19" },
  { reg: "2523030", name: "YAGO RICARDO DA SILVA MERGULHÃO", gender: "MASCULINO", birth: "2012-08-16", enrollment: "2026-01-19" },
  { reg: "2517936", name: "YANI FAUSTINO MENDES", gender: "FEMININO", birth: "2012-10-22", enrollment: "2026-01-19" }
];

async function sync8A() {
  console.log('--- INICIANDO SINCRONIZACAO 8\u00ba ANO A (BIOGRAFIA) ---');
  
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
        status: 'ATIVO' // Status inicial
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

  // 3. Cleanup: Remove extra students from this classroom
  console.log('\n--- LIMPANDO MATR\u00cdCULAS ANTIGAS ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 8A...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync8A().catch(err => console.error('ERRO FATAL:', err));
