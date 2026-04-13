const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'da962df6-f915-4f3a-a3e5-778681f01d19'; // 7º ANO E

const studentsData = [
  { reg: "2596598", name: "ANGELO FERREIRA CORBALAN", gender: "MASCULINO", birth: "2013-07-04", enrollment: "2026-01-19", transport: true, paed: false },
  { reg: "2244517", name: "ANY KAROLYNY GONÇALVES ROCHA", gender: "FEMININO", birth: "2013-11-11", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2208348", name: "BEATRIZ RIBEIRO DE SOUZA", gender: "FEMININO", birth: "2013-03-31", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2136344", name: "GUSTAVO HENRIQUE CRUZ DA SILVA", gender: "MASCULINO", birth: "2012-07-04", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2420336", name: "IREBERE METUKTIRE", gender: "FEMININO", birth: "2013-08-19", enrollment: "2026-01-19", transport: false, paed: false, status: 'TRANSFERIDO', adjustDate: '2026-03-10' },
  { reg: "2208334", name: "ISADORA ZANOVELLO DA SILVA", gender: "FEMININO", birth: "2013-08-17", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2213985", name: "KETHELLY YASMIN ALVES BISPO", gender: "FEMININO", birth: "2013-12-03", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2228554", name: "KOKOYAMROTI METUKTIRE TAPAYUNA", gender: "FEMININO", birth: "2013-06-25", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2604723", name: "LAURA IASMIN CAMPUS SILVA", gender: "FEMININO", birth: "2014-03-20", enrollment: "2026-01-19", transport: false, paed: false, status: 'TRANSFERIDO', adjustDate: '2026-03-05' },
  { reg: "2623793", name: "LAYLA LORELLAY DE OLIVEIRA SILVA", gender: "FEMININO", birth: "2012-12-18", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2613255", name: "LEIDIANE VILLA RIEDEL", gender: "FEMININO", birth: "2013-07-23", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2601238", name: "LUIZ OTÁVIO NIEDERMEYER", gender: "MASCULINO", birth: "2012-08-21", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2246483", name: "MARIA EDUARDA GONSALVES RIBEIRO", gender: "FEMININO", birth: "2013-06-12", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2413159", name: "MAYK NATANAEL MAY DA SILVA", gender: "MASCULINO", birth: "2013-12-27", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2601671", name: "NHAKNHYRY TXUCARRAMÃE", gender: "FEMININO", birth: "2013-12-09", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2352757", name: "PEDRO LUCCA GOMES DA SILVA", gender: "MASCULINO", birth: "2013-11-10", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2203137", name: "PEDRO RAFAEL AMÂNCIO DE LIMA", gender: "MASCULINO", birth: "2013-01-03", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2601426", name: "RAISSA MARTINS SANTOS", gender: "FEMININO", birth: "2013-11-14", enrollment: "2026-01-19", transport: true, paed: false },
  { reg: "2370537", name: "SAMELLA FLORES FERMINO", gender: "FEMININO", birth: "2012-07-08", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2418734", name: "SARA MAYARA DE OLIVEIRA MEDEIROS", gender: "FEMININO", birth: "2012-10-13", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2537653", name: "TAKAK JAMRO METUKTIRE", gender: "FEMININO", birth: "2011-05-12", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2603427", name: "TEPYIN YANARI METUKTIRE", gender: "MASCULINO", birth: "2013-05-03", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2604711", name: "THAWANY FERNANDA DE JESUS CORDEIRO", gender: "FEMININO", birth: "2013-10-17", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2623157", name: "TIAGO DOMINGUES DOS SANTOS", gender: "MASCULINO", birth: "2013-09-16", enrollment: "2026-01-19", transport: true, paed: false },
  { reg: "2208483", name: "VITOR GABRIEL LIMA SILVA", gender: "MASCULINO", birth: "2013-05-05", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2258234", name: "VITÓRIA BORGES CARDOSO", gender: "FEMININO", birth: "2013-04-27", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2207809", name: "WELLITON DA SILVA LOZANO", gender: "MASCULINO", birth: "2013-07-19", enrollment: "2026-01-19", transport: false, paed: false },
  { reg: "2722312", name: "JOÃO PEDRO SOUZA CAETANO PEREIRA", gender: "MASCULINO", birth: "2012-01-30", enrollment: "2026-01-30", transport: false, paed: false },
  { reg: "2631278", name: "MATHEUS RAMOS SOARES", gender: "MASCULINO", birth: "2014-03-06", enrollment: "2026-02-02", transport: false, paed: false }
];

async function sync7E() {
  console.log('--- INICIANDO SINCRONIZACAO COMPLETA 7\u00ba ANO E ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let updatedCount = 0;

  for (const s of studentsData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Upsert Student Core Info + Flags
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        gender: s.gender,
        birth_date: s.birth,
        paed: s.paed,
        school_transport: s.transport,
        status: s.status || 'ATIVO'
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
        status: s.status || 'ATIVO',
        adjustment_date: s.adjustDate || null
      }, { onConflict: 'student_id,classroom_id' });

    if (enrollError) {
      console.log(`\u274c ERRO MATR\u00cdCULA: ${enrollError.message}`);
    } else {
      console.log('OK' + (s.status ? ` (${s.status})` : ''));
      updatedCount++;
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
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 7E...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${updatedCount} alunos processados.`);
}

sync7E().catch(err => console.error('ERRO FATAL:', err));
