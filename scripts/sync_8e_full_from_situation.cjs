const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '38c288c5-ca89-470a-8094-7ee1d25be13c'; // 8º ANO E

const studentsData = [
  { reg: "2139797", name: "ANA BEATRIZ SOARES DE OLIVEIRA", paed: false, transport: false },
  { reg: "2542199", name: "ANA CLARA ALMEIDA DA SILVA", paed: false, transport: false },
  { reg: "2090754", name: "BEPOI METUKTIRE", paed: false, transport: false },
  { reg: "2137816", name: "CAIO DA SILVA BEZERRA", paed: false, transport: false },
  { reg: "2523589", name: "DAVI MATTOS DE QUEIROZ", paed: false, transport: true },
  { reg: "2268719", name: "EDUARDO GABRIEL DE FREITAS GUIMARÃES", paed: false, transport: false },
  { reg: "2522509", name: "FERNANDA EDUARDA SANT ANA DOS SANTOS", paed: false, transport: false },
  { reg: "2137088", name: "GABRIEL ARAUJO PETERLINI", paed: false, transport: true },
  { reg: "2550684", name: "HYGOR KAUAN RODRIGUES DOS SANTOS DA COSTA", paed: false, transport: true },
  { reg: "2047417", name: "KEDYMA CRISTINA DOS SANTOS CORRÊA", paed: false, transport: false },
  { reg: "2147945", name: "KELVIN NAUAN NOVACK ALVES", paed: false, transport: false },
  { reg: "2421261", name: "LAURA IZABELLY FERMINO DA SILVA", paed: false, transport: false },
  { reg: "2048521", name: "LUIZ GUSTAVO GONÇALO DE LIMA", paed: false, transport: false },
  { reg: "2193020", name: "MAKWITYI TAPAYUNA", paed: false, transport: false, status: 'TRANSFERIDO', adjustDate: '2026-03-10' },
  { reg: "2555038", name: "MANOEL MESSIAS ARAUJO DA SILVA", paed: false, transport: false },
  { reg: "2512787", name: "MARIA HELOIZA DE ALMEIDA SALVATO", paed: false, transport: true },
  { reg: "2528356", name: "MURILO GABRIEL SANTOS DO NASCIMENTO", paed: false, transport: true },
  { reg: "2555059", name: "PEDRO HENRIQUE ARAUJO DA SILVA", paed: false, transport: false },
  { reg: "2565522", name: "REINALTY GABRIEL DOS SANTOS NEVES", paed: false, transport: false },
  { reg: "2137132", name: "WESLEY DE SOUZA AMORIM", paed: false, transport: true },
  { reg: "2133636", name: "YSABELLY KAUANE BRITO DE SOUSA", paed: false, transport: false },
  { reg: "2084492", name: "BEPKRÂKARATI METUKTIRE", paed: false, transport: false },
  { reg: "2169180", name: "CLEIDIANE LIMA DA CONCEIÇÃO", paed: false, transport: false },
  { reg: "2167703", name: "WELLITOM GARCIA DOS SANTOS", paed: false, transport: false },
  { reg: "2514154", name: "KAUAN VINICIUS SOUZA SILVA", paed: false, transport: false },
  { reg: "2551541", name: "RUBYÂN FERNNANDA VIEIRA", paed: false, transport: false },
  { reg: "2574458", name: "JHOYCE KATRYNE BORGES DE FRANÇA", paed: false, transport: false },
  { reg: "2071452", name: "SARAH MARTINI SANTOS", paed: false, transport: false },
  { reg: "2537496", name: "JULIA VITORIA FURLAN LAZARIN", paed: false, transport: false },
  { reg: "2623273", name: "LUIZA EMANUELY MARQUES ALMEIDA", paed: false, transport: true },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", paed: true, transport: false, status: 'ATIVO' },
  { reg: "2464953", name: "RAFFAELLA VITORYA GARCIA DOS SANTOS", paed: false, transport: false }
];

async function sync8E() {
  console.log('--- INICIANDO SINCRONIZACAO 8\u00ba ANO E (COMPLETA) ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let count = 0;

  for (const s of studentsData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Upsert Student core info (with placeholder birth_date if new)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        paed: s.paed,
        school_transport: s.transport,
        status: s.status || 'ATIVO',
        // placeholder birth_date if not exist, will be updated or kept as 2013-01-01
        birth_date: '2013-01-01' 
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.log(`\u274c ERRO ESTUDANTE: ${studentError.message}`);
      continue;
    }

    // 2. Upsert Enrollment
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: student.id,
        classroom_id: classroomId,
        status: s.status || 'ATIVO',
        adjustment_date: s.adjustDate || null
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
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 8E...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync8E().catch(err => console.error('ERRO FATAL:', err));
