const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'dfbffcc2-c598-4bca-bcbc-d8bc4eef22f3'; // 9º ANO E

const studentsData = [
  { reg: "2050582", name: "ADRYAN GABRIEL BEZERRA FERRANTE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050276", name: "AMANDA GABRIELLY CARDOSO DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2437739", name: "ANA BEATRIZ DOS SANTOS SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436577", name: "ANA CLARA FIERI MANSANO", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2436528", name: "ANA MARIA PEREIRA DE OLIVEIRA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429308", name: "ARTHUR SERGIO DORINI PEREIRA", enroll: "2026-01-19", status: "ATIVO", paed: true, transp: true },
  { reg: "2048569", name: "CLARA CASSIMIRO LEITE DOS SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2489093", name: "DAVI SANTOS SOARES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "1983765", name: "DIEGO JUNIO MARTINS DE ARA\u00daJO", enroll: "2026-01-19", status: "ATIVO", paed: true },
  { reg: "2035427", name: "ELIANA CRISTINA PEREIRA GIZONI", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429314", name: "EMANUELY TONON MOREIRA DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050211", name: "EMILLY CAUANI ALVES BISPO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429327", name: "JO\u00c3O VICTOR DOS SANTOS BORGES", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "1991538", name: "KAMIHA METUKTIRE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2342762", name: "KAUANY SANITA CANGU\u00c7U", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2043254", name: "KETHELLEN NORAINY PEREIRA NETO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2140547", name: "LARA BEATRIZ SALGADO RIBEIRO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2417324", name: "LORENA AUGUSTO GOMES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2053612", name: "LUCAS PERES SERDEIRA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "1989168", name: "LUIZ ANTONIO DA SILVA DE SOUZA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2048425", name: "NADHELLY VITORIA MORAES DA COSTA FERREIRA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429250", name: "PEDRO HENRIQUE DE SANTANA GUIMAR\u00c3ES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2051329", name: "PEDRO HENRIQUE SOARES GOMES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2045918", name: "THAIS LARISSA BATISTA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429282", name: "VICTOR GABRIEL SANTOS CAVALCANTE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2439390", name: "VIT\u00d3RIA CAZELATO VALERIANO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436792", name: "YASMIM VITORIA FREITAS WEIDLICH", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2429340", name: "MARIA EDUARDA BACHIEGA DA COSTA", enroll: "2026-02-02", status: "ATIVO", transp: true },
  { reg: "2429251", name: "MARYA ISABEL DA SILVA PRADO", enroll: "2026-02-02", status: "ATIVO" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", enroll: "2026-02-18", status: "TRANSFERIDO", adj: "2026-03-19", paed: true }
];

async function sync9E() {
  console.log('--- SINCRONIZANDO 9\u00ba ANO E ---');
  const officialRegs = new Set(studentsData.map(s => s.reg));
  let count = 0;

  for (const s of studentsData) {
    // 1. Upsert Student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        paed: s.paed || false,
        school_transport: s.transp || false,
        birth_date: '2012-01-01' // Placeholder
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.error(`\u274c Erro no estudante ${s.reg}:`, studentError.message);
      continue;
    }

    // 2. Upsert Enrollment
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
      console.error(`\u274c Erro na matr\u00edcula ${s.reg}:`, enrollError.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  // 3. Cleanup
  console.log('\n--- LIMPANDO TURMA 9E ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} da turma 9E...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\n\u2705 Sincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync9E().catch(err => console.error('ERRO FATAL:', err));
