const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '61ee771d-c65d-4c1c-b608-2e736db324b3'; // 7º ANO D

const studentsData = [
  { reg: "2580815", name: "ANA HELOISA DO NASCIMENTO", gender: "FEMININO", birth: "2014-04-04", enrollment: "2026-01-19" },
  { reg: "2137069", name: "ANA VITORIA DOS SANTOS MATEUS", gender: "FEMININO", birth: "2013-04-03", enrollment: "2026-01-19" },
  { reg: "2601272", name: "ANDRIELY CAMARA DE SOUZA", gender: "FEMININO", birth: "2013-06-20", enrollment: "2026-01-19" },
  { reg: "2176526", name: "BEKWYPRYTO METUKTIRE TXUCARRAMÃE", gender: "FEMININO", birth: "2011-06-08", enrollment: "2026-01-19" },
  { reg: "2486770", name: "BRENDA VITORIA DOS SANTOS BESERRA", gender: "FEMININO", birth: "2013-04-05", enrollment: "2026-01-19" },
  { reg: "2308856", name: "BRUNO VICTOR PEREIRA DA SILVA", gender: "MASCULINO", birth: "2013-08-22", enrollment: "2026-01-19" },
  { reg: "2191657", name: "CARLOS EDUARDO ALVES CIRILO", gender: "MASCULINO", birth: "2013-03-14", enrollment: "2026-01-19" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", gender: "MASCULINO", birth: "2011-05-10", enrollment: "2026-01-29" },
  { reg: "2589370", name: "DAVI LUCAS ARANHA DA SILVA", gender: "MASCULINO", birth: "2013-07-10", enrollment: "2026-01-19" },
  { reg: "2208534", name: "EDUARDA CARVALHO COSTA", gender: "FEMININO", birth: "2013-11-20", enrollment: "2026-01-19" },
  { reg: "2614263", name: "ERICK HONORATO FAGUNDES DE OLIVEIRA", gender: "MASCULINO", birth: "2013-05-05", enrollment: "2026-01-19" },
  { reg: "2601462", name: "ESTER MARTINS DA SILVA", gender: "FEMININO", birth: "2013-02-25", enrollment: "2026-01-19" },
  { reg: "1974328", name: "IREKARE METUKTIRE", gender: "FEMININO", birth: "2010-04-16", enrollment: "2026-01-19" },
  { reg: "2601591", name: "ISAAC BALDUINO DA COSTA", gender: "MASCULINO", birth: "2013-12-08", enrollment: "2026-01-19" },
  { reg: "2580615", name: "ISABELLY GONÇALVES ALVES", gender: "FEMININO", birth: "2013-05-01", enrollment: "2026-01-19" },
  { reg: "2599665", name: "ISADORA SANTOS CAVALCANTE", gender: "FEMININO", birth: "2013-08-19", enrollment: "2026-01-19" },
  { reg: "2597818", name: "IZADORA FERREIRA DOS SANTOS", gender: "FEMININO", birth: "2013-06-06", enrollment: "2026-01-19" },
  { reg: "2208341", name: "JORGE HENRIQUE DOS SANTOS DA COSTA", gender: "MASCULINO", birth: "2013-10-19", enrollment: "2026-01-19" },
  { reg: "2595500", name: "JULLYANA ALONSO ARAUJO", gender: "FEMININO", birth: "2014-01-27", enrollment: "2026-01-19" },
  { reg: "2244544", name: "KARINE VICTORIA OLIVEIRA CÂNDIDO", gender: "FEMININO", birth: "2013-07-12", enrollment: "2026-01-19" },
  { reg: "2597303", name: "KAYKY RAFAEL DORINI DO PRADO", gender: "MASCULINO", birth: "2013-12-01", enrollment: "2026-01-19" },
  { reg: "2246485", name: "KEMILY KAUANY OLIVEIRA DOS SANTOS", gender: "FEMININO", birth: "2013-07-16", enrollment: "2026-01-19" },
  { reg: "2208561", name: "KENYA KATIELLY DA SILVA SANTOS", gender: "FEMININO", birth: "2014-01-05", enrollment: "2026-01-19" },
  { reg: "2239392", name: "KOKOYAPOJTI METUKTIRE", gender: "FEMININO", birth: "2013-09-02", enrollment: "2026-01-19" },
  { reg: "2137209", name: "KRYSTHOFFER GABRIEL MARTINS BORGES", gender: "MASCULINO", birth: "2013-01-15", enrollment: "2026-01-19" },
  { reg: "2599285", name: "LUIZ FRANCISCO ROBERT ABREU", gender: "MASCULINO", birth: "2013-10-17", enrollment: "2026-01-19" },
  { reg: "2722366", name: "MARIA ELOIZA CAETANO NASCIMENTO", gender: "FEMININO", birth: "2014-03-12", enrollment: "2026-01-30" },
  { reg: "2142305", name: "PEDRO GABRIEL SANTOS DA SILVA", gender: "MASCULINO", birth: "2012-11-10", enrollment: "2026-01-19" },
  { reg: "2207882", name: "TALITA SANTIAGO DE OLIVEIRA BENTO", gender: "FEMININO", birth: "2014-03-16", enrollment: "2026-01-19" },
  { reg: "2581467", name: "YURI RAFAEL DOS SANTOS OLIVEIRA", gender: "MASCULINO", birth: "2013-06-06", enrollment: "2026-01-19" },
  { reg: "2731779", name: "ISAC YTALLO FEITOSA OLIVEIRA", gender: "MASCULINO", birth: "2010-10-14", enrollment: "2026-03-23" }
];

async function sync7D() {
  console.log('--- INICIANDO SINCRONIZACAO 7\u00ba ANO D ---');
  
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
        gender: s.gender === 'M' ? 'MASCULINO' : 'FEMININO',
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

  // 3. Cleanup: Remove extra students from this classroom
  console.log('\n--- LIMPANDO MATR\u00cdCULAS EXTRA ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 7D...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${updatedCount} alunos processados.`);
}

sync7D().catch(err => console.error('ERRO FATAL:', err));
