const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b'; // 7º ANO B

const studentsData = [
  { reg: "2207901", name: "MURILO SEICENTOS DE LIMA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2603175", name: "MYCILLENE APARECIDA DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2581604", name: "PEDRO HENRIQUE REBOUÇAS SALGO", paed: true, transport: false, enrollment: "2026-01-19" },
  { reg: "2243589", name: "TAKAKAJYRY METUKTIRE", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2648005", name: "THIAGO GOMES FERREIRA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2210228", name: "VITOR DANIEL ARQUINO BATISTA", paed: true, transport: false, enrollment: "2026-01-19" },
  { reg: "2586548", name: "YASMIN VITÓRIA DE AZEVEDO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2208354", name: "AMANDA ESTEFANY SIQUEIRA DA SILVA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2623156", name: "ANA BEATRIZ PEREIRA MENDES DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2603223", name: "ANNA LAURA SILVA RIBEIRO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2584687", name: "BRENDO HENRIQUE DE OLIVEIRA NOVAIS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2149607", name: "CLEICIANE SOARES RODRIGUES", paed: false, transport: false, enrollment: "2026-01-19", status: 'TRANSFERIDO', adjustDate: '2026-02-19' },
  { reg: "2600821", name: "FELIP APARECIDO BELARMINO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2584780", name: "ISABELLY PEREIRA DE SOUZA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2214165", name: "JOÃO PEDRO SABOIA RAMOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2584978", name: "JOÃO VITOR RAMOS CALBERTO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2645141", name: "JOHONNY SOUZA ALMEIDA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2405268", name: "KAIQUE JOSÉ CANDIDO DA SILVA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2338472", name: "KAYLA RAFAELA LAGE HORNICH", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2417540", name: "KETHELYN SOFIA DE SOUSA DOS SANTOS", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2240478", name: "KOKONÁ TXUKARRAMÃE", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2581600", name: "LUIZ FELIPE BRAIDA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2248251", name: "LUKAS GONÇALVES DOMINGOS", paed: true, transport: false, enrollment: "2026-01-19" },
  { reg: "2348898", name: "MARIA LARA DAL PUPO DE CARVALHO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2587454", name: "MARIA VITÓRIA DA SILVA SOUZA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2207895", name: "MIGUEL SEICENTOS DE LIMA", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2600560", name: "MIKAELLY SANTOS AZEVEDO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2652310", name: "YASMIN VITORIA DO NASCIMENTO FIGUEIREDO", paed: false, transport: false, enrollment: "2026-01-19" },
  { reg: "2600464", name: "HEVILLY GARCIA JARDIM", paed: false, transport: false, enrollment: "2026-01-19", status: 'TRANSFERIDO', adjustDate: '2026-03-20' }
];

async function sync7B() {
  console.log('--- SINCRONIZACAO COMPLETA TURMA 7\u00ba ANO B ---');
  
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let count = 0;

  for (const s of studentsData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Upsert Student core info + flags
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        birth_date: "2013-01-01", // Placeholder, a ser atualizado com o relatório de idade
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

    // 2. Upsert Enrollment + transfer status
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
      count++;
    }
  }

  // 3. Cleanup: Remove students NOT in official list for this classroom
  console.log('\n--- LIMPANDO MATR\u00cdCULAS ANTIGAS ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 7B...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync7B().catch(err => console.error('ERRO FATAL:', err));
