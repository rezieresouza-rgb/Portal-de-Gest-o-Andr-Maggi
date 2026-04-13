const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'e77718aa-af6c-4a4e-a243-372df483166a'; // 9º ANO C

const studentsData = [
  { reg: "2416807", name: "ANA BEATRIZ SILVEIRA HESPER AZEVEDO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429791", name: "ANA LUIZA BARBOSA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429741", name: "ANA LUIZA SILVERIO SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429307", name: "ANA ROSA MARISCAL CARBO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2051268", name: "ANDR\u00c9 DE OLIVEIRA SOUZA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2012675", name: "ANTONIO PEDRO CAZARI DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2200705", name: "EDUARDA RODRIGUES COSTA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2053450", name: "EMANUELLY VITORIA MATOS SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2343081", name: "GUSTAVO SANTOS DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429871", name: "HELOISA KARINE SOUZA DOS SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050836", name: "JO\u00c3O VITOR MENDES SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429329", name: "JULIO SEZAR BATISTA DA SILVA", enroll: "2026-01-19", status: "ATIVO", paed: true },
  { reg: "2647514", name: "KAU\u00c9 DE ALMEIDA SOARES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429802", name: "KEMILLY FERREIRA DOS SANTOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429335", name: "LARISSA APARECIDA FERMIANO DE SOUZA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2297927", name: "LEANDRO DANTAS COSTA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2195809", name: "LEONAN MATEUS AGUIAR ARAUJO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429249", name: "LUAN CHAGAS DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436376", name: "MARIA EDUARDA RODRIGUES OLIVEIRA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2436423", name: "MILENA AGUIAR RAMOS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429808", name: "NATHAN VINICIOS FERNANDES DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2591301", name: "PEDRO HENRIQUE NOVAES BORGES", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050318", name: "SOPHIA DA SILVA MARIANO", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429277", name: "STHEFANY DE SOUZA NICOLETI", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2430538", name: "THALES CAU\u00c3 DO NASCIMENTO SARDELI", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429285", name: "VINICIUS CORDEIRO MARTINS", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2050177", name: "BIANCA DUARTE DA SILVA", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2007491", name: "BEKWYJPA PANAR\u00c1 METUKTIRE", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2429318", name: "GUSTAVO NICOLAS LIMA DAPPER", enroll: "2026-01-19", status: "ATIVO" },
  { reg: "2343748", name: "LARA VITORIA BARBOSA DA SILVA", enroll: "2026-02-02", status: "TRANSFERIDO", adj: "2026-03-06" },
  { reg: "2725845", name: "MARIANA MENDES COSTA", enroll: "2026-02-09", status: "ATIVO" }
];

async function sync9C() {
  console.log('--- SINCRONIZANDO 9\u00ba ANO C ---');
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
  console.log('\n--- LIMPANDO TURMA 9C ---');
  const { data: currentEnrollments } = await supabase
    .from('enrollments')
    .select('id, students(registration_number, name)')
    .eq('classroom_id', classroomId);

  for (const e of currentEnrollments || []) {
    if (!officialRegs.has(e.students?.registration_number)) {
      console.log(`[-] Removendo ${e.students?.name} da turma 9C...`);
      await supabase.from('enrollments').delete().eq('id', e.id);
    }
  }

  console.log(`\n\u2705 Sincroniza\u00e7\u00e3o conclu\u00edda: ${count} alunos processados.`);
}

sync9C().catch(err => console.error('ERRO FATAL:', err));
