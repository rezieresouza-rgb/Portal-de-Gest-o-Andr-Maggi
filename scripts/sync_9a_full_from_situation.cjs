const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '2c5e5b7d-111e-48ac-b8f8-3f1abedf7148'; // 9º ANO A

const studentsData = [
  { reg: "2057387", name: "AMABILE CAETANO DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2076441", name: "ANA PAULA PAÇOS DE OLIVEIRA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2095644", name: "ANDRIELLY CAROLINE DA SILVA PARINTINS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2050208", name: "ANNY HELENA OLIVEIRA DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2048482", name: "DEBORA RAMOS DE OLIVEIRA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2050308", name: "DEIVID VIANA LEITE", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2084982", name: "EDUARDO DA SILVA SALES", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2436262", name: "HEDUARDO MORAIS DE SOUZA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2050334", name: "JOÃO VITOR DE OLIVEIRA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2436859", name: "JOSE VITOR TRAMARIN COUTINHO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2050351", name: "JOSIAS RODRIGUES DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2429328", name: "JULIA LAÍS BRAIDA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2195692", name: "KAUÃ VINICIUS SOARES ROMAN", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2050292", name: "LUCAS CORREIA RODRIGUES", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2435167", name: "LUIZ ARTHUR DO NASCIMENTO JÁCOME", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2115842", name: "LUIZ GUILHERME SIMÕES DE OLIVEIRA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2429809", name: "LUIZ HENRIQUE COSTA FERREIRA DE AZEVEDO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2057371", name: "LUIZ HENRIQUE GOULART FERNANDES", paed: true, transport: false, enrollment: "2026-01-19" },
  { reg: "2464919", name: "MARIA VITÓRIA RAMOS DA SILVA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2438336", name: "MARIANE GODOY DE AQUINO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2518402", name: "MARYANA DOMINGOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2429254", name: "MURILO PEREIRA AMARAL", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2487206", name: "PEDRO HENRIQUE CHAGAS DA ROSA", paed: false, transport: false, enrollment: "2026-01-19", status: 'TRANSFERIDO', adjustDate: '2026-04-01' },
  { reg: "2068810", name: "RAFAEL DOS SANTOS LEMOS", paed: false, transport: false, enrollment: "2026-01-19", status: 'TRANSFERIDO', adjustDate: '2026-04-02' },
  { reg: "1997429", name: "STEFANY PEREIRA DA SILVA SIMPLICIO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2436458", name: "VICTOR GABRIEL DIAS CARON", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2423591", name: "YURI FAUSTINO MENDES", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2085457", name: "ANA VITORIA ALMOND DUARTE", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2074580", name: "GUSTAVO ANGELO REBOUÇAS PASIN", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2165610", name: "ANA JULIA RODRIGUES PEZZUTI", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", paed: true, transport: false, enrollment: "2026-03-20", status: 'TRANSFERIDO', adjustDate: '2026-03-20' }
];

async function sync9A() {
  console.log('--- INICIANDO SINCRONIZACAO 9\u00ba ANO A (COMPLETA) ---');
  
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
        paed: s.paed,
        school_transport: s.transport,
        status: s.status || 'ATIVO',
        // placeholder birth_date if not exist
        birth_date: '2012-01-01' 
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
        enrollment_date: s.enrollment,
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
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 9A...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync9A().catch(err => console.error('ERRO FATAL:', err));
