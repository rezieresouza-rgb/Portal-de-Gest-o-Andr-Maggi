const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'c4151923-5eba-4ef9-a989-a0d8e66658c5'; // 9º ANO B

const studentsData = [
  { reg: "2048392", name: "ANA BEATRIZ DA SILVA GON\u00c7ALVES PESSOA", gender: "FEMININO", birth: "2012-02-20", enrollment: "2026-02-02" },
  { reg: "2429796", name: "ANNA JULYA DA SILVA MARTINS", gender: "FEMININO", birth: "2012-03-30", enrollment: "2026-01-19" },
  { reg: "2366300", name: "ANNE BEATRIZ TELES DE ANACLETO", gender: "FEMININO", birth: "2011-08-29", enrollment: "2026-01-19" },
  { reg: "2048612", name: "ANTONY DAVI DA COSTA FREITAS", gender: "MASCULINO", birth: "2012-01-20", enrollment: "2026-01-19" },
  { reg: "2117028", name: "ANTONY HENRIQUE ARQUINO DE CAMPOS", gender: "MASCULINO", birth: "2011-07-22", enrollment: "2026-01-19" },
  { reg: "2068947", name: "BRUNO DA SILVA", gender: "MASCULINO", birth: "2011-06-11", enrollment: "2026-01-19" },
  { reg: "2050911", name: "EDUARDA DOS ANJOS MATEUS", gender: "FEMININO", birth: "2011-08-08", enrollment: "2026-01-19" },
  { reg: "2048587", name: "EDUARDO GABRIEL DE SOUZA PACHIGU\u00c1", gender: "MASCULINO", birth: "2011-08-08", enrollment: "2026-01-19" },
  { reg: "2537652", name: "GUILHERME HENRIQUE NOBREGA NEGRETE GARCIA", gender: "MASCULINO", birth: "2012-02-07", enrollment: "2026-01-19" },
  { reg: "2264395", name: "HEITOR CASSIANO BRAGA RODRIGUES", gender: "MASCULINO", birth: "2011-07-04", enrollment: "2026-01-19" },
  { reg: "2464809", name: "HENRIQUE CESAR PEREIRA DA SILVA", gender: "MASCULINO", birth: "2012-02-06", enrollment: "2026-01-19" },
  { reg: "2247164", name: "IGOR DE JESUS DE SOUZA", gender: "MASCULINO", birth: "2011-07-11", enrollment: "2026-01-19" },
  { reg: "2542824", name: "INGRID GABRIELY SOUZA MATOS", gender: "FEMININO", birth: "2011-09-08", enrollment: "2026-01-19" },
  { reg: "2472665", name: "IZABELY CRISTINI DA SILVA MARINHO", gender: "FEMININO", birth: "2010-04-13", enrollment: "2026-02-02" },
  { reg: "2429322", name: "JHOYCE DOS SANTOS", gender: "FEMININO", birth: "2011-10-07", enrollment: "2026-01-19" },
  { reg: "2044100", name: "JO\u00c3O PEDRO INACIO DE OLIVEIRA", gender: "MASCULINO", birth: "2012-01-22", enrollment: "2026-01-19" },
  { reg: "2439166", name: "JOAO VICTOR TEODORO DAPPER BALIERO", gender: "MASCULINO", birth: "2011-04-08", enrollment: "2026-01-19" },
  { reg: "2436226", name: "KAMILLY VITORIA SILVA DIAS", gender: "FEMININO", birth: "2011-10-21", enrollment: "2026-01-19" },
  { reg: "2048505", name: "KENEDY ALVES DOS SANTOS PEREIRA", gender: "MASCULINO", birth: "2011-12-17", enrollment: "2026-01-19" },
  { reg: "2436109", name: "LARISSA LEITE BISPO DOS SANTOS", gender: "FEMININO", birth: "2011-08-09", enrollment: "2026-01-19" },
  { reg: "2048909", name: "LUDYMILA LIMA BRITO", gender: "FEMININO", birth: "2011-06-08", enrollment: "2026-01-19" },
  { reg: "2554939", name: "MAIKELLY RODRIGUES DE OLIVEIRA", gender: "FEMININO", birth: "2010-08-19", enrollment: "2026-01-19" },
  { reg: "2566965", name: "NICOLE AHITANA PENALOZA ACEVEDO", gender: "FEMININO", birth: "2010-03-25", enrollment: "2026-01-19" },
  { reg: "2429816", name: "RENATO DOS SANTOS SILVA", gender: "MASCULINO", birth: "2011-08-31", enrollment: "2026-01-19" },
  { reg: "2374146", name: "SILVANO JUNIOR FERREIRA DE AZEVEDO", gender: "MASCULINO", birth: "2011-06-27", enrollment: "2026-01-19" },
  { reg: "2490594", name: "STHEPHANIE CIBELE MARTINS DOS SANTOS", gender: "FEMININO", birth: "2011-12-19", enrollment: "2026-01-19" },
  { reg: "1977407", name: "TIAGO SABOIA RAMOS", gender: "MASCULINO", birth: "2010-06-14", enrollment: "2026-01-19" },
  { reg: "2203148", name: "YASMIN RAFAELA AM\u00c2NCIO DE LIMA", gender: "FEMININO", birth: "2010-09-03", enrollment: "2026-01-19" },
  { reg: "2457076", name: "YASMIN VIT\u00d3RIA DE OLIVEIRA ARA\u00daJO", gender: "FEMININO", birth: "2011-07-12", enrollment: "2026-01-19" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 9\u00ba ANO B ---');
  let count = 0;

  for (const s of studentsData) {
    // 1. Upsert Student Core Info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        registration_number: s.reg,
        name: s.name.toUpperCase(),
        gender: s.gender,
        birth_date: s.birth
      }, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.error(`\u274c Erro ao atualizar biografia ${s.reg}:`, studentError.message);
      continue;
    }

    // 2. Ensure Enrollment is correct
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: student.id,
        classroom_id: classroomId,
        enrollment_date: s.enrollment
      }, { onConflict: 'student_id,classroom_id' });

    if (enrollError) {
      console.error(`\u274c Erro ao atualizar matr\u00edcula ${s.reg}:`, enrollError.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  // Cleanup potential incorrect Bruno (2058947) if exists
  console.log('\n--- LIMPANDO DISCREP\u00c2NCIAS ---');
  await supabase.from('enrollments').delete().match({ classroom_id: classroomId }).filter('students.registration_number', 'eq', '2058947');

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados com biografia completa.`);
}

syncBiography();
