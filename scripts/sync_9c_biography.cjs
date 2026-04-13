const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'e77718aa-af6c-4a4e-a243-372df483166a'; // 9º ANO C

const biographyData = [
  { reg: "2416807", name: "ANA BEATRIZ SILVEIRA HESPER AZEVEDO", gender: "FEMININO", birth: "2011-08-30" },
  { reg: "2429791", name: "ANA LUIZA BARBOSA SILVA", gender: "FEMININO", birth: "2011-08-29" },
  { reg: "2429741", name: "ANA LUIZA SILVERIO SANTOS", gender: "FEMININO", birth: "2012-09-21" },
  { reg: "2429307", name: "ANA ROSA MARISCAL CARBO", gender: "FEMININO", birth: "2011-07-13" },
  { reg: "2051268", name: "ANDR\u00c9 DE OLIVEIRA SOUZA", gender: "MASCULINO", birth: "2012-02-17" },
  { reg: "2012675", name: "ANTONIO PEDRO CAZARI DA SILVA", gender: "MASCULINO", birth: "2011-08-12" },
  { reg: "2007491", name: "BEKWYJPA PANAR\u00c1 METUKTIRE", gender: "FEMININO", birth: "2009-05-05" },
  { reg: "2050177", name: "BIANCA DUARTE DA SILVA", gender: "FEMININO", birth: "2012-04-12" },
  { reg: "2200705", name: "EDUARDA RODRIGUES COSTA", gender: "FEMININO", birth: "2011-04-01" },
  { reg: "2053450", name: "EMANUELLY VITORIA MATOS SILVA", gender: "FEMININO", birth: "2011-10-11" },
  { reg: "2429316", name: "GUSTAVO NICOLAS LIMA DAPPER", gender: "MASCULINO", birth: "2012-01-17" },
  { reg: "2343081", name: "GUSTAVO SANTOS DA SILVA", gender: "MASCULINO", birth: "2011-09-01" },
  { reg: "2429871", name: "HELOISA KARINE SOUZA DOS SANTOS", gender: "FEMININO", birth: "2011-10-26" },
  { reg: "2050836", name: "JO\u00c3O VITOR MENDES SANTOS", gender: "MASCULINO", birth: "2011-07-14" },
  { reg: "2429329", name: "JULIO SEZAR BATISTA DA SILVA", gender: "MASCULINO", birth: "2011-08-10" },
  { reg: "2647514", name: "KAU\u00c9 DE ALMEIDA SOARES", gender: "MASCULINO", birth: "2012-07-30" },
  { reg: "2429802", name: "KEMILLY FERREIRA DOS SANTOS", gender: "FEMININO", birth: "2011-06-27" },
  { reg: "2343748", name: "LARA VITORIA BARBOSA DA SILVA", gender: "FEMININO", birth: "2012-01-28" },
  { reg: "2429335", name: "LARISSA APARECIDA FERMIANO DE SOUZA", gender: "FEMININO", birth: "2011-06-27" },
  { reg: "2297927", name: "LEANDRO DANTAS COSTA", gender: "MASCULINO", birth: "2012-04-18" },
  { reg: "2195809", name: "LEONAN MATEUS AGUIAR ARAUJO", gender: "MASCULINO", birth: "2011-10-21" },
  { reg: "2429249", name: "LUAN CHAGAS DA SILVA", gender: "MASCULINO", birth: "2011-09-27" },
  { reg: "2436376", name: "MARIA EDUARDA RODRIGUES OLIVEIRA", gender: "FEMININO", birth: "2011-11-24" },
  { reg: "2436423", name: "MILENA AGUIAR RAMOS", gender: "FEMININO", birth: "2011-07-08" },
  { reg: "2429808", name: "NATHAN VINICIOS FERNANDES DA SILVA", gender: "MASCULINO", birth: "2011-07-18" },
  { reg: "2591301", name: "PEDRO HENRIQUE NOVAES BORGES", gender: "MASCULINO", birth: "2012-01-23" },
  { reg: "2050318", name: "SOPHIA DA SILVA MARIANO", gender: "FEMININO", birth: "2012-02-03" },
  { reg: "2429277", name: "STHEFANY DE SOUZA NICOLETI", gender: "FEMININO", birth: "2011-10-27" },
  { reg: "2430538", name: "THALES CAU\u00c3 DO NASCIMENTO SARDELI", gender: "MASCULINO", birth: "2012-02-12" },
  { reg: "2429285", name: "VINICIUS CORDEIRO MARTINS", gender: "MASCULINO", birth: "2011-10-28" },
  { reg: "2725845", name: "MARIANA MENDES COSTA", gender: "FEMININO", birth: "2011-10-18" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 9\u00ba ANO C ---');
  let count = 0;

  for (const s of biographyData) {
    // 1. Upsert Student (Name, Birth, Gender)
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
      console.error(`\u274c Erro ${s.reg}:`, studentError.message);
      continue;
    }

    // 2. Ensure Enrollment exists
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: student.id,
        classroom_id: classroomId
      }, { onConflict: 'student_id,classroom_id' });

    if (enrollError) {
      console.error(`\u274c Erro Matr\u00edcula ${s.reg}:`, enrollError.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  // Correction for Gustavo Nicolas old ID (2429318) if it persists
  console.log('\n--- LIMPANDO DISCREP\u00c2NCIAS ---');
  await supabase.from('enrollments').delete().match({ classroom_id: classroomId }).filter('students.registration_number', 'eq', '2429318');

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados com biografia.`);
}

syncBiography();
