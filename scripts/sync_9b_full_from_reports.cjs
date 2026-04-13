const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'c4151923-5eba-4ef9-a989-a0d8e66658c5'; // 9º ANO B

const ninetyBData = [
  { reg: "2429796", name: "ANNA JULYA DA SILVA MARTINS", guardian: "EDIMAIDA DA SILVA", phone: "(66) 996450522", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2366300", name: "ANNE BEATRIZ TELES DE ANACLETO", guardian: "JHONES MARTINS DE ANACLETO", phone: "(66) 997260708", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048612", name: "ANTONY DAVI DA COSTA FREITAS", guardian: "SAMIA MAIARA DA COSTA", phone: "(66) 992568318", enroll: "2026-01-19", status: "TRANSFERIDO", adj: "2026-03-10" },
  { reg: "2117028", name: "ANTONY HENRIQUE ARQUINO DE CAMPOS", guardian: "DAIANE ARQUINO XAVIER", phone: "(66) 996408026", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2058947", name: "BRUNO DA SILVA", guardian: "DILMA PEREIRA DA SILVA", phone: "(66) 997218522", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048587", name: "EDUARDO GABRIEL DE SOUZA PACHIGUÁ", guardian: "ROZANGELA DAMASCENO SILVA", phone: "(66) 96744530", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2537652", name: "GUILHERME HENRIQUE NOBREGA NEGRETE GARCIA", guardian: "DORALICE NOBREGA ALVES", phone: "(66) 997133922", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2264395", name: "HEITOR CASSIANO BRAGA RODRIGUES", guardian: "ELIENE DOS SANTOS BRAGA", phone: "(66) 999860380", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2464809", name: "HENRIQUE CESAR PEREIRA DA SILVA", guardian: "SAMUEL DE SOUZA SILVA", phone: "(66) 999865018", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2247164", name: "IGOR DE JESUS DE SOUZA", guardian: "MONICA DOS SANTOS DE JESUS", phone: "(66) 999192570", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2542824", name: "INGRID GABRIELY SOUZA MATOS", guardian: "JULIANE DE OLIVEIRA MATOS", phone: "(94) 991144119", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429322", name: "JHOYCE DOS SANTOS", guardian: "CLAUDIANE PEREIRA DOS SANTOS", phone: "(66) 997160485", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2439166", name: "JOAO VICTOR TEODORO DAPPER BALIERO", guardian: "JESSICA TEODORO DA SILVA", phone: "(66) 999526545", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436226", name: "KAMILLY VITORIA SILVA DIAS", guardian: "JESSICA MAYARA ELOI DA SILVA", phone: "(66) 999082874", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048505", name: "KENEDY ALVES DOS SANTOS PEREIRA", guardian: "VERINHA ALVES DE ALMEIDA", phone: "(66) 996050641", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436109", name: "LARISSA LEITE BISPO DOS SANTOS", guardian: "CRISTIANE LEITE DA SILVA SANTOS", phone: "(66) 996234808", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048909", name: "LUDYMILA LIMA BRITO", guardian: "FRANCIELLE DA SILVA LIMA", phone: "(66) 999436682", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2554939", name: "MAIKELLY RODRIGUES DE OLIVEIRA", guardian: "GLEICE MARIA COSTA RODRIGUES", phone: "(66) 996299845", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429816", name: "RENATO DOS SANTOS SILVA", guardian: "LUCIENE DE ALVES DOS SANTOS", phone: "(66) 996597587", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2374146", name: "SILVANO JUNIOR FERREIRA DE AZEVEDO", guardian: "FABIANA FERREIRA DA SILVA", phone: "(66) 996020391", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2490594", name: "STHEPHANIE CIBELE MARTINS DOS SANTOS", guardian: "SUZIENE BATISTA MARTINS", phone: "(66) 992177342", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "1977407", name: "TIAGO SABOIA RAMOS", guardian: "VAL\u00c9RIA TAMIRES SABOIA RAMOS", phone: "(66) 999386401", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2457076", name: "YASMIN VIT\u00d3RIA DE OLIVEIRA ARA\u00daJO", guardian: "VIVIANE MARTINS DE ARA\u00daJO", phone: "(66) 999662253", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050911", name: "EDUARDA DOS ANJOS MATEUS", guardian: "ERISVANE DE PAULA DOS ANJOS", phone: "(66) 999199227", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2566965", name: "NICOLE AHITANA PENALOZA ACEVEDO", guardian: "LENA JOHANNA ACEVEDO ESCOBAR", phone: "(66) 995803324", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2044100", name: "JO\u00c3O PEDRO INACIO DE OLIVEIRA", guardian: "VANESSA MACHADO DE OLIVEIRA", phone: "(66) 996815499", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2203148", name: "YASMIN RAFAELA AM\u00c2NCIO DE LIMA", guardian: "JANAINA AM\u00c2NCIO DA SILVA", phone: "(61) 983942373", enroll: "2026-01-19", status: "TRANSFERIDO" },
  { reg: "2048392", name: "ANA BEATRIZ DA SILVA GON\u00c7ALVES PESSOA", guardian: "ELIZABETH GON\u00c7ALVES ROCHA PESSOA", phone: "(66) 995233241", enroll: "2026-02-02", status: "ATIVO" },
  { reg: "2472665", name: "IZABELY CRISTINI DA SILVA MARINHO", guardian: "ELIZIANE APARECIDA DO NASCIMENTO DA SILVA", phone: "(66) 995708412", enroll: "2026-02-02", status: "ATIVO" }
];

async function sync9B() {
  console.log('--- SINCRONIZANDO 9\u00ba ANO B (DADOS COMPLETOS) ---');
  const officialRegs = new Set(ninetyBData.map(s => s.reg));
  let count = 0;

  for (const s of ninetyBData) {
    process.stdout.write(`[\u2713] Sincronizando: ${s.name} [${s.reg}]... `);
    
    // 1. Update/Insert Student Biography & Contacts
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        guardian_name: s.guardian.toUpperCase(),
        contact_phone: s.phone,
        status: s.status,
        birth_date: '2012-01-01' // Placeholder
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.log(`\u274c ERRO ESTUDANTE: ${studentError.message}`);
      continue;
    }

    // 2. Update/Insert Enrollment
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: student.id,
        classroom_id: classroomId,
        status: s.status,
        enrollment_date: s.enroll,
        adjustment_date: s.adj || null
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
      console.log(`[-] Removendo ${e.students?.name} [${e.students?.registration_number}] da turma 9B...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\nSincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync9B().catch(err => console.error('ERRO FATAL:', err));
