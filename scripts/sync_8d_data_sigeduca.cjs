const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'e20aaa1c-a24c-4d8c-bcfb-00b795db10b5'; // 8º ANO D

const studentsData = [
  { reg: "2515838", name: "ALLANA MONIKY ARAUJO DE ALMEIDA", gender: "FEMININO", birth: "2012-08-01", enrollment: "2026-01-19" },
  { reg: "2517940", name: "ANA CLARA MATEUS VIEIRA", gender: "FEMININO", birth: "2012-09-09", enrollment: "2026-02-02" },
  { reg: "2517885", name: "ANA ISABELY DE SOUSA SANTOS", gender: "FEMININO", birth: "2012-11-16", enrollment: "2026-01-19" },
  { reg: "2139704", name: "ANNA BEATRIZ ALVES DA SILVA", gender: "FEMININO", birth: "2013-03-27", enrollment: "2026-01-19" },
  { reg: "2048417", name: "CARLOS HENRRIQUE LUNA DE SOUZA", gender: "MASCULINO", birth: "2012-01-08", enrollment: "2026-01-19" },
  { reg: "2422873", name: "DANILO GALVÃO FERREIRA", gender: "MASCULINO", birth: "2011-12-12", enrollment: "2026-01-19" },
  { reg: "2137232", name: "ELOYZA VITÓRIA SILVA NUNES", gender: "FEMININO", birth: "2012-11-25", enrollment: "2026-01-19" },
  { reg: "2517888", name: "EMANUELY DOS SANTOS DA SILVA", gender: "FEMININO", birth: "2013-03-17", enrollment: "2026-01-19" },
  { reg: "2517931", name: "EMANUELY ODY FRANÇA", gender: "FEMININO", birth: "2012-10-17", enrollment: "2026-01-19" },
  { reg: "2517919", name: "ENZO GABRIEL CONCEIÇÃO DA SILVA", gender: "MASCULINO", birth: "2012-11-16", enrollment: "2026-01-19" },
  { reg: "2552429", name: "ESTER VITORIA FELIZARDO DE SOUZA", gender: "FEMININO", birth: "2012-06-05", enrollment: "2026-01-19" },
  { reg: "2153149", name: "GABRIEL DE ALMEIDA GOMES DE OLIVEIRA", gender: "MASCULINO", birth: "2012-11-19", enrollment: "2026-01-19" },
  { reg: "2426271", name: "GABRIEL KALLEBY SOUZA DA COSTA", gender: "MASCULINO", birth: "2012-05-10", enrollment: "2026-01-19" },
  { reg: "2522608", name: "GUSTAVO HENRIQUE CANGUÇU DOS SANTOS", gender: "MASCULINO", birth: "2012-06-14", enrollment: "2026-01-19" },
  { reg: "2439134", name: "HENRIK GABRIEL PEREIRA DAPPER", gender: "MASCULINO", birth: "2011-11-13", enrollment: "2026-01-19" },
  { reg: "2137172", name: "JOÃO PHEDRO SALVALAGIO", gender: "MASCULINO", birth: "2012-10-26", enrollment: "2026-01-19" },
  { reg: "2167924", name: "JOSÉ RICARDO SOBRINHO LEMOS", gender: "MASCULINO", birth: "2012-12-14", enrollment: "2026-01-19" },
  { reg: "2168508", name: "KELLY SAMARA LEME DE OLIVEIRA", gender: "FEMININO", birth: "2012-12-08", enrollment: "2026-01-19" },
  { reg: "2137743", name: "KEMILLY BEATRYZ CARDOSO DA COSTA", gender: "FEMININO", birth: "2012-07-31", enrollment: "2026-01-19" },
  { reg: "2330432", name: "KEMILLY VITORIA DORINI JACINTO", gender: "FEMININO", birth: "2012-02-02", enrollment: "2026-01-19" },
  { reg: "2560541", name: "KÔKÔ-E METUKTIRE", gender: "FEMININO", birth: "2012-08-30", enrollment: "2026-01-19" },
  { reg: "2131934", name: "LUCAS ISMAEL CHAVES MENDONÇA", gender: "MASCULINO", birth: "2012-09-07", enrollment: "2026-01-19" },
  { reg: "2137196", name: "LUIZ FELIPE GONSALVES DE LIMA", gender: "MASCULINO", birth: "2013-01-29", enrollment: "2026-01-19" },
  { reg: "2532702", name: "LUIZ FERNANDO ALVES DE GODOI", gender: "MASCULINO", birth: "2012-05-09", enrollment: "2026-01-19" },
  { reg: "2524647", name: "MARIANY DOS SANTOS SANTANA", gender: "FEMININO", birth: "2012-12-01", enrollment: "2026-01-19" },
  { reg: "2157475", name: "NATALIA RIBEIRO DOS SANTOS", gender: "FEMININO", birth: "2012-12-08", enrollment: "2026-01-19" },
  { reg: "2166695", name: "NGOTIRE METUKTIRE", gender: "MASCULINO", birth: "2011-05-31", enrollment: "2026-01-19" },
  { reg: "2160248", name: "RAFAELLI DE SOUZA CAVALCANTE", gender: "FEMININO", birth: "2013-03-25", enrollment: "2026-02-02" },
  { reg: "2290273", name: "TOTXAN METUKTIRE", gender: "MASCULINO", birth: "2012-08-29", enrollment: "2026-01-19" },
  { reg: "2422343", name: "YSTEFANE BEATRIZ RODRIGUES CLEMENTINO", gender: "FEMININO", birth: "2012-09-02", enrollment: "2026-01-19" }
];

async function sync8D() {
  console.log('--- INICIANDO SINCRONIZACAO 8\u00ba ANO D (BIOGRAFIA) ---');
  
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
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 8D...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync8D().catch(err => console.error('ERRO FATAL:', err));
