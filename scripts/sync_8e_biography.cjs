const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '38c288c5-ca89-470a-8094-7ee1d25be13c'; // 8º ANO E

const studentsData = [
  { reg: "2139797", name: "ANA BEATRIZ SOARES DE OLIVEIRA", gender: "FEMININO", birth: "2013-01-04", enrollment: "2026-01-19" },
  { reg: "2542199", name: "ANA CLARA ALMEIDA DA SILVA", gender: "FEMININO", birth: "2012-01-26", enrollment: "2026-01-19" },
  { reg: "2084492", name: "BEPKRÂKARATI METUKTIRE", gender: "MASCULINO", birth: "2011-07-25", enrollment: "2026-01-19" },
  { reg: "2090754", name: "BEPOI METUKTIRE", gender: "MASCULINO", birth: "2011-01-26", enrollment: "2026-01-19" },
  { reg: "2137816", name: "CAIO DA SILVA BEZERRA", gender: "MASCULINO", birth: "2012-08-07", enrollment: "2026-01-19" },
  { reg: "2169180", name: "CLEIDIANE LIMA DA CONCEIÇÃO", gender: "FEMININO", birth: "2012-08-01", enrollment: "2026-01-19" },
  { reg: "2523989", name: "DAVI MATTOS DE QUEIROZ", gender: "MASCULINO", birth: "2012-08-23", enrollment: "2026-01-19" },
  { reg: "2268719", name: "EDUARDO GABRIEL DE FREITAS GUIMARÃES", gender: "MASCULINO", birth: "2013-04-16", enrollment: "2026-01-19" },
  { reg: "2522509", name: "FERNANDA EDUARDA SANT ANA DOS SANTOS", gender: "FEMININO", birth: "2012-12-20", enrollment: "2026-01-19" },
  { reg: "2137088", name: "GABRIEL ARAUJO PETERLINI", gender: "MASCULINO", birth: "2012-09-03", enrollment: "2026-01-19" },
  { reg: "2550684", name: "HYGOR KAUAN RODRIGUES DOS SANTOS DA COSTA", gender: "MASCULINO", birth: "2012-09-10", enrollment: "2026-01-19" },
  { reg: "2574458", name: "JHOYCE KATRYNE BORGES DE FRANÇA", gender: "FEMININO", birth: "2011-07-31", enrollment: "2026-01-19" },
  { reg: "2514154", name: "KAUAN VINICIUS SOUZA SILVA", gender: "MASCULINO", birth: "2012-08-02", enrollment: "2026-01-19" },
  { reg: "2047417", name: "KEDYMA CRISTINA DOS SANTOS CORRÊA", gender: "FEMININO", birth: "2011-11-17", enrollment: "2026-01-19" },
  { reg: "2147945", name: "KELVIN NAUAN NOVACK ALVES", gender: "MASCULINO", birth: "2012-05-26", enrollment: "2026-01-19" },
  { reg: "2421261", name: "LAURA IZABELLY FERMINO DA SILVA", gender: "FEMININO", birth: "2012-09-25", enrollment: "2026-01-19" },
  { reg: "2048521", name: "LUIZ GUSTAVO GONÇALO DE LIMA", gender: "MASCULINO", birth: "2012-02-14", enrollment: "2026-01-19" },
  { reg: "2193620", name: "MAKWITYI TAPAYUNA", gender: "MASCULINO", birth: "2012-09-12", enrollment: "2026-01-19" },
  { reg: "2555038", name: "MANOEL MESSIAS ARAUJO DA SILVA", gender: "MASCULINO", birth: "2012-06-13", enrollment: "2026-01-19" },
  { reg: "2512787", name: "MARIA HELOIZA DE ALMEIDA SALVATO", gender: "FEMININO", birth: "2011-06-14", enrollment: "2026-01-19" },
  { reg: "2528956", name: "MURILO GABRIEL SANTOS DO NASCIMENTO", gender: "MASCULINO", birth: "2012-12-29", enrollment: "2026-01-19" },
  { reg: "2555059", name: "PEDRO HENRIQUE ARAUJO DA SILVA", gender: "MASCULINO", birth: "2011-03-14", enrollment: "2026-01-19" },
  { reg: "2565522", name: "REINALTY GABRIEL DOS SANTOS NEVES", gender: "MASCULINO", birth: "2013-01-29", enrollment: "2026-01-19" },
  { reg: "2551541", name: "RUBYÂN FERNNANDA VIEIRA", gender: "FEMININO", birth: "2012-11-21", enrollment: "2026-01-19" },
  { reg: "2071452", name: "SARAH MARTINI SANTOS", gender: "FEMININO", birth: "2013-01-27", enrollment: "2026-01-19" },
  { reg: "2167703", name: "WELLITOM GARCIA DOS SANTOS", gender: "MASCULINO", birth: "2013-02-03", enrollment: "2026-01-19" },
  { reg: "2137132", name: "WESLEY DE SOUZA AMORIM", gender: "MASCULINO", birth: "2012-09-11", enrollment: "2026-01-19" },
  { reg: "2133636", name: "YSABELLY KAUANE BRITO DE SOUSA", gender: "FEMININO", birth: "2013-03-18", enrollment: "2026-01-19" },
  { reg: "2537496", name: "JULIA VITORIA FURLAN LAZARIN", gender: "FEMININO", birth: "2011-11-24", enrollment: "2026-02-05" },
  { reg: "2623273", name: "LUIZA EMANUELY MARQUES ALMEIDA", gender: "FEMININO", birth: "2013-01-08", enrollment: "2026-02-13" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", gender: "MASCULINO", birth: "2011-05-10", enrollment: "2026-02-18" },
  { reg: "2464953", name: "RAFFAELLA VITORYA GARCIA DOS SANTOS", gender: "FEMININO", birth: "2011-12-02", enrollment: "2026-03-24" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 8\u00ba ANO E ---');
  let count = 0;

  for (const s of studentsData) {
    // 1. Update Student Biography
    const { data: student, error: studentError } = await supabase
      .from('students')
      .update({
        gender: s.gender,
        birth_date: s.birth,
        name: s.name.toUpperCase()
      })
      .eq('registration_number', s.reg)
      .select('id')
      .single();

    if (studentError) {
      console.error(`\u274c Erro ao atualizar biografia ${s.reg}:`, studentError.message);
      continue;
    }

    // 2. Update Enrollment Date
    const { error: enrollError } = await supabase
      .from('enrollments')
      .update({
        enrollment_date: s.enrollment
      })
      .match({ student_id: student.id, classroom_id: classroomId });

    if (enrollError) {
      console.error(`\u274c Erro ao atualizar matr\u00edcula ${s.reg}:`, enrollError.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados com biografia.`);
}

syncBiography();
