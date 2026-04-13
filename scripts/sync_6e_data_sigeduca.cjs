const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '8aeaeed2-e475-4c54-9245-69228e5fcc52'; // 6º ANO E

const studentsData = [
  { reg: "2674904", name: "ADRYAN SOUSA DOS ANJOS", gender: "MASCULINO", birth: "2015-03-21", enrollment: "2026-01-19" },
  { reg: "2673457", name: "ANA CLARA DE OLIVEIRA ANDRADE", gender: "FEMININO", birth: "2015-03-27", enrollment: "2026-01-19" },
  { reg: "2350612", name: "ELOISA MOREIRA DONATO", gender: "FEMININO", birth: "2014-08-25", enrollment: "2026-01-19" },
  { reg: "2315761", name: "EMILY VITORIA DE ALMEIDA FAUSTINO", gender: "FEMININO", birth: "2014-10-16", enrollment: "2026-01-19" },
  { reg: "2671297", name: "GABRIELA HENRIQUE GIZONI DA SILVA", gender: "FEMININO", birth: "2014-04-14", enrollment: "2026-01-19" },
  { reg: "2693480", name: "GREG NAUAN DO AMARAL", gender: "MASCULINO", birth: "2013-03-13", enrollment: "2026-01-19" },
  { reg: "2686851", name: "GUILHERME DOS SANTOS AMORIM", gender: "MASCULINO", birth: "2014-10-05", enrollment: "2026-01-19" },
  { reg: "2693387", name: "GUILHERME HENRIQ MOREIRA DA SILVA", gender: "MASCULINO", birth: "2014-08-27", enrollment: "2026-01-19" },
  { reg: "2671845", name: "HESTER BEATRIZ DOS SANTOS MARTIRIO", gender: "FEMININO", birth: "2014-05-05", enrollment: "2026-01-19" },
  { reg: "2671253", name: "JOÃO LUIZ MESQUITA SILVA DOS SANTOS", gender: "MASCULINO", birth: "2014-05-05", enrollment: "2026-01-19" },
  { reg: "2421264", name: "JOÃO PEDRO FERMINO DA SILVA", gender: "MASCULINO", birth: "2015-01-05", enrollment: "2026-01-19" },
  { reg: "2421444", name: "JOAQUIM LEITE MARCHIORO", gender: "MASCULINO", birth: "2014-12-28", enrollment: "2026-01-19" },
  { reg: "2673453", name: "JOSÉ EDUARDO DOURADO DE ARAUJO", gender: "MASCULINO", birth: "2013-11-26", enrollment: "2026-01-19" },
  { reg: "2721826", name: "JOSE MARCIO LEMOS CABRAL", gender: "MASCULINO", birth: "2014-09-11", enrollment: "2026-01-30" },
  { reg: "2313125", name: "KHYMBERLLY KLERYS VAZ DE OLIVEIRA", gender: "FEMININO", birth: "2014-10-28", enrollment: "2026-01-19" },
  { reg: "2290250", name: "KOKOIREJ MARIZA METUKTIRE", gender: "FEMININO", birth: "2014-08-28", enrollment: "2026-01-19" },
  { reg: "2277854", name: "LUIZ MIGUEL CHAVES MENDONÇA", gender: "MASCULINO", birth: "2015-01-05", enrollment: "2026-01-19" },
  { reg: "2297923", name: "MARYA CLARA FERREIRA DOS SANTOS", gender: "FEMININO", birth: "2014-07-28", enrollment: "2026-01-19" },
  { reg: "2671433", name: "MIKAELLY CRISTINA FERREIRA DOS SANTOS", gender: "FEMININO", birth: "2015-01-18", enrollment: "2026-01-19" },
  { reg: "2681047", name: "NÍCOLAS JOSÉ PEREIRA VIANA", gender: "MASCULINO", birth: "2014-11-06", enrollment: "2026-01-19" },
  { reg: "2673503", name: "RAYQUE VITOR DOS SANTOS RODRIGUES", gender: "MASCULINO", birth: "2014-12-23", enrollment: "2026-01-19" },
  { reg: "2569399", name: "ROSE EMANUELLY ALMEIDA AGUIAR", gender: "FEMININO", birth: "2014-12-29", enrollment: "2026-01-19" },
  { reg: "2312384", name: "RUTE DOS SANTOS MAGIOLO", gender: "FEMININO", birth: "2015-03-11", enrollment: "2026-01-19" },
  { reg: "2694555", name: "SAMUEL LUIS FERREIRA DA SILVA", gender: "MASCULINO", birth: "2014-10-22", enrollment: "2026-01-19" },
  { reg: "2478383", name: "VICTOR JOAQUIM MARQUES MADEIRA", gender: "MASCULINO", birth: "2014-08-28", enrollment: "2026-01-11" },
  { reg: "2721632", name: "WIDYNEI HENRIQUE DOS SANTOS CORREA", gender: "MASCULINO", birth: "2014-11-28", enrollment: "2026-01-19" },
  { reg: "2693981", name: "YASMIN MARIA VITORIA NASCIMENTO DA SILVA PEDROSO", gender: "FEMININO", birth: "2014-07-27", enrollment: "2026-01-19" },
  { reg: "2338717", name: "YAYOKE ARISTIDES DO NASCIMENTO JURUNA", gender: "MASCULINO", birth: "2015-01-05", enrollment: "2026-01-19" },
  { reg: "2309740", name: "YZANNI YONARA RIBEIRO DE SOUZA", gender: "FEMININO", birth: "2014-12-31", enrollment: "2026-01-19" },
  { reg: "2725279", name: "ALEXANDRE MOURA DOS SANTOS", gender: "MASCULINO", birth: "2014-06-26", enrollment: "2026-02-05" },
  { reg: "2349428", name: "WEVILYN NICOLE FREITA DA SILVA", gender: "FEMININO", birth: "2014-10-03", enrollment: "2026-04-07" }
];

async function sync6E() {
  console.log('--- INICIANDO SINCRONIZAO 6\u00ba ANO E ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let updatedCount = 0;
  let skippedCount = 0;

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

  // 3. Cleanup: Remove extra students from this classroom
  console.log('\n--- LIMPANDO MATR\u00cdCULAS EXTRA ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 6E...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${updatedCount} alunos processados.`);
}

sync6E().catch(err => console.error('ERRO FATAL:', err));
