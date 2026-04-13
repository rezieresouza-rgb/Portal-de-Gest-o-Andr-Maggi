const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '6126c0dd-efbf-478b-9e61-4353af06ae5a'; // 9º ANO D

const studentsData = [
  { reg: "2436145", name: "ALAN REBUSSI DOMINGUES", enroll: "2026-01-19", status: "ATIVO", paed: true, transp: true },
  { reg: "2235064", name: "ANDERSON RIBEIRO DA SILVA", enroll: "2026-01-19", status: "ATIVO", paed: true },
  { reg: "2057496", name: "ANDRESSA OLIVEIRA DOMINGOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2328374", name: "DANIEL RIBEIRO DE SOUZA", enroll: "2026-01-19", status: "TRANSFERIDO", adj: "2026-03-27" },
  { reg: "2482022", name: "DOUGLAS DE SOUZA BACHIEGA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2105151", name: "EDUARDO GONSALVES FERREIRA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2452301", name: "EMANUELLY VITORIA ALONSO FELIX", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2396159", name: "ENZO GABRIEL MOREIRA DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2499840", name: "FERNANDO GABRIEL MACHADO LEITE", enroll: "2026-01-19", status: "ATIVO", paed: true },
  { reg: "1977496", name: "GUSTAVO HENRIQUE DA SILVA ALVES", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "1684109", name: "IRENGRA TI PI-YKRE METUKTIRE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048893", name: "ISABELLA ZANOVELLO DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436046", name: "ITHALO APARECIDO GRANZIERI DE SOUZA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2436081", name: "JO\u00c3O PEDRO BARROS NAVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2113039", name: "JO\u00c3O VICTOR DE SOUZA CAVALCANTE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2298572", name: "JULIO CESAR PERTELI BATISTA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2048598", name: "LUAN BARBOSA GON\u00c7ALVES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050704", name: "LUANA GABRIELA DE SOUZA DIAS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2097232", name: "MARIA VIT\u00d3RIA GONZAGA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2057543", name: "MILENA GABRIELLY DE SANTANA NOGUEIRA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2429260", name: "PAULA FERNANDA VIEIRA DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2413160", name: "PEDRO MAY DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2044686", name: "PEDRO MIGUEL DOS SANTOS DA SILVA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2051314", name: "RENATO DOS SANTOS MOTA", enroll: "2026-01-19", status: "ATIVO", transp: true },
  { reg: "2343118", name: "RUAN GABRIEL RODRIGUES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2087068", name: "THAINARA LAIS BATISTA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2437184", name: "WADYSTON NUNES DE ALMEIDA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2085176", name: "WEYDYKATXI TAPAIUNA METUKTIRE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2343688", name: "CAIQUE CARDOSO DOS SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2169362", name: "GUSTAVO GABRIEL DOS SANTOS SILVA", enroll: "2026-02-04", status: "TRANSFERIDO", adj: "2026-03-12" }
];

async function sync9D() {
  console.log('--- SINCRONIZANDO 9\u00ba ANO D (COMPLETO) ---');
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
  console.log('\n--- LIMPANDO TURMA 9D ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} da turma 9D...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\n\u2705 Sincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync9D().catch(err => console.error('ERRO FATAL:', err));
