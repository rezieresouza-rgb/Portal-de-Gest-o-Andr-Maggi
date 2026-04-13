const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '332b3668-2df0-4041-82fd-0ad1d3275260'; // 7º ANO A

const studentsData = [
  { reg: "2651735", name: "DAVI LUCA BARBOSA MOREIRA", gender: "MASCULINO", birth: "2013-05-09", enrollment: "2026-01-19" },
  { reg: "2595180", name: "DHAFFINE LAVINYA GOMES FERREIRA", gender: "FEMININO", birth: "2014-03-13", enrollment: "2026-01-19" },
  { reg: "2649923", name: "EMANUELLY MORAES GOMES", gender: "FEMININO", birth: "2014-03-19", enrollment: "2026-01-19" },
  { reg: "2231709", name: "EMANUELLY VITÓRIA DIAS PRATES", gender: "FEMININO", birth: "2013-04-22", enrollment: "2026-01-19" },
  { reg: "2223181", name: "EMILLY VITORIA FOCAS DE AMORIM", gender: "FEMININO", birth: "2013-06-01", enrollment: "2026-01-19" },
  { reg: "2208540", name: "ENDREW ALVES DE SOUZA", gender: "MASCULINO", birth: "2013-05-29", enrollment: "2026-01-19" },
  { reg: "2588048", name: "ENZO DA COSTA LIMA", gender: "MASCULINO", birth: "2013-10-11", enrollment: "2026-01-19" },
  { reg: "2596515", name: "ENZO JOSÉ DE SOUZA NICOLETI", gender: "MASCULINO", birth: "2013-11-21", enrollment: "2026-01-19" },
  { reg: "2626709", name: "ERYKSOM KAUAM PEREIRA DA SILVA", gender: "MASCULINO", birth: "2013-12-13", enrollment: "2026-01-19" },
  { reg: "2651633", name: "FABRICIO LEANDRO FLOR VERDADEIRO", gender: "MASCULINO", birth: "2013-09-26", enrollment: "2026-01-19" },
  { reg: "2599606", name: "FELIPE BONETTI MILHEIRO", gender: "MASCULINO", birth: "2013-07-12", enrollment: "2026-01-19" },
  { reg: "2596783", name: "GABRIEL HENRIKE DUARTE", gender: "MASCULINO", birth: "2013-11-07", enrollment: "2026-01-19" },
  { reg: "2595083", name: "GEOVANA KETTELLEEN NASCIMENTO DA COSTA", gender: "FEMININO", birth: "2014-02-24", enrollment: "2026-01-19" },
  { reg: "2587899", name: "GUSTAVO AMORIM DOS SANTOS", gender: "MASCULINO", birth: "2013-06-11", enrollment: "2026-01-19" },
  { reg: "2651630", name: "GUSTAVO SILVA FLOR", gender: "MASCULINO", birth: "2013-12-14", enrollment: "2026-01-19" },
  { reg: "2231294", name: "HELOISE PEDROTTI RAMOS", gender: "FEMININO", birth: "2013-09-20", enrollment: "2026-01-19" },
  { reg: "2405507", name: "ISABELA SOARES DO BEM", gender: "FEMININO", birth: "2013-08-22", enrollment: "2026-01-19" },
  { reg: "2208914", name: "JOÃO GABRIEL DA SILVA", gender: "MASCULINO", birth: "2013-08-14", enrollment: "2026-01-19" },
  { reg: "2596601", name: "JOÃO LUCAS DO NASCIMENTO LIMA", gender: "MASCULINO", birth: "2014-02-03", enrollment: "2026-01-19" },
  { reg: "2246470", name: "JÚLLIA RAFAELA GOMES DA CRUZ", gender: "FEMININO", birth: "2013-04-13", enrollment: "2026-01-19" },
  { reg: "2580648", name: "KAUAN EDUARDO BITENCOURT", gender: "MASCULINO", birth: "2013-11-27", enrollment: "2026-01-19" },
  { reg: "2599033", name: "LORRAYNE SOUZA JACINTO", gender: "FEMININO", birth: "2013-05-20", enrollment: "2026-01-19" },
  { reg: "2596196", name: "NAYANI FERNANDES DA SILVA", gender: "FEMININO", birth: "2013-05-02", enrollment: "2026-01-19" },
  { reg: "2600523", name: "PEDRO HENRIQUE TREVIZAN DA SILVA", gender: "MASCULINO", birth: "2013-09-07", enrollment: "2026-01-19" },
  { reg: "2213860", name: "SAMELA VITORIA RAMOS ANDRADE", gender: "FEMININO", birth: "2013-06-21", enrollment: "2026-01-19" },
  { reg: "2596401", name: "SARAH DOS SANTOS LIMA", gender: "FEMININO", birth: "2013-08-08", enrollment: "2026-01-19" },
  { reg: "2600770", name: "SARAH PEREIRA DE ALMEIDA", gender: "FEMININO", birth: "2013-11-15", enrollment: "2026-01-19" },
  { reg: "2600785", name: "SOPHIA PEREIRA DE ALMEIDA", gender: "FEMININO", birth: "2013-11-15", enrollment: "2026-01-19" },
  { reg: "2604263", name: "TAYNARA FIGUEIREDO VASCON", gender: "FEMININO", birth: "2014-01-30", enrollment: "2026-01-19" },
  { reg: "2198238", name: "VICTTOR HUGGO MONTEIRO DE SOUZA", gender: "MASCULINO", birth: "2012-07-01", enrollment: "2026-01-19" }
];

async function sync7A() {
  console.log('--- INICIANDO SINCRONIZAO 7\u00ba ANO A ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let updatedCount = 0;

  for (const s of studentsData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Upsert Student
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
      updatedCount++;
    }
  }

  // 3. Cleanup: Remove students NOT in official list for this classroom
  console.log('\n--- LIMPANDO MATR\u00cdCULAS EXTRA ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 7A...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${updatedCount} alunos processados.`);
}

sync7A().catch(err => console.error('ERRO FATAL:', err));
