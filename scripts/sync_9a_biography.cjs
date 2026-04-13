const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '2c5e5b7d-111e-48ac-b8f8-3f1abedf7148'; // 9º ANO A

const studentsData = [
  { reg: "2057387", name: "AMÁBILE CAETANO DOS SANTOS", gender: "FEMININO", birth: "2012-04-19", enrollment: "2026-01-19" },
  { reg: "2165610", name: "ANA JULIA RODRIGUES PEZZUTI", gender: "FEMININO", birth: "2011-11-18", enrollment: "2026-01-19" },
  { reg: "2076441", name: "ANA PAULA PAÇOS DE OLIVEIRA", gender: "FEMININO", birth: "2012-02-23", enrollment: "2026-01-19" },
  { reg: "2085457", name: "ANA VITORIA ALMOND DUARTE", gender: "FEMININO", birth: "2011-09-24", enrollment: "2026-01-19" },
  { reg: "2095644", name: "ANDRIELLY CAROLINE DA SILVA PARINTINS", gender: "FEMININO", birth: "2011-10-18", enrollment: "2026-01-19" },
  { reg: "2050208", name: "ANNY HELENA OLIVEIRA DOS SANTOS", gender: "FEMININO", birth: "2012-02-08", enrollment: "2026-01-19" },
  { reg: "2048482", name: "DÉBORA RAMOS DE OLIVEIRA", gender: "FEMININO", birth: "2011-05-13", enrollment: "2026-01-19" },
  { reg: "2050308", name: "DEIVID VIANA LEITE", gender: "MASCULINO", birth: "2011-09-22", enrollment: "2026-01-19" },
  { reg: "2084982", name: "EDUARDO DA SILVA SALES", gender: "MASCULINO", birth: "2011-04-07", enrollment: "2026-01-19" },
  { reg: "2074580", name: "GUSTAVO ANGELO REBOUÇAS PASIN", gender: "MASCULINO", birth: "2011-12-09", enrollment: "2026-01-19" },
  { reg: "2436262", name: "HEDUARDO MORAIS DE SOUZA", gender: "MASCULINO", birth: "2011-11-07", enrollment: "2026-01-19" },
  { reg: "2050334", name: "JOÃO VITOR DE OLIVEIRA", gender: "MASCULINO", birth: "2012-04-18", enrollment: "2026-01-19" },
  { reg: "2436859", name: "JOSE VITOR TRAMARIN COUTINHO", gender: "MASCULINO", birth: "2011-02-25", enrollment: "2026-01-19" },
  { reg: "2050351", name: "JOSIAS RODRIGUES DOS SANTOS", gender: "MASCULINO", birth: "2012-03-03", enrollment: "2026-01-19" },
  { reg: "2429328", name: "JULIA LAÍS BRAIDA", gender: "FEMININO", birth: "2011-07-15", enrollment: "2026-01-19" },
  { reg: "2195692", name: "KAUÃ VINÍCIUS SOARES ROMAN", gender: "MASCULINO", birth: "2011-05-03", enrollment: "2026-01-19" },
  { reg: "2050292", name: "LUCAS CORREIA RODRIGUES", gender: "MASCULINO", birth: "2011-12-09", enrollment: "2026-01-19" },
  { reg: "2435167", name: "LUIZ ARTHUR DO NASCIMENTO JÁCOME", gender: "MASCULINO", birth: "2011-07-07", enrollment: "2026-01-19" },
  { reg: "2115842", name: "LUIZ GUILHERME SIMÕES DE OLIVEIRA", gender: "MASCULINO", birth: "2011-02-22", enrollment: "2026-01-19" },
  { reg: "2429809", name: "LUIZ HENRIQUE COSTA FERREIRA DE AZEVEDO", gender: "MASCULINO", birth: "2011-12-11", enrollment: "2026-01-19" },
  { reg: "2057371", name: "LUIZ HENRIQUE GOULART FERNANDES", gender: "MASCULINO", birth: "2012-02-11", enrollment: "2026-01-19" },
  { reg: "2464919", name: "MARIA VITÓRIA RAMOS DA SILVA", gender: "FEMININO", birth: "2011-12-21", enrollment: "2026-01-19" },
  { reg: "2438336", name: "MARIANE GODOY DE AQUINO", gender: "FEMININO", birth: "2011-12-24", enrollment: "2026-01-19" },
  { reg: "2518402", name: "MARYANA DOMINGOS", gender: "FEMININO", birth: "2012-05-10", enrollment: "2026-01-19" },
  { reg: "2429254", name: "MURILO PEREIRA AMARAL", gender: "MASCULINO", birth: "2012-03-23", enrollment: "2026-01-19" },
  { reg: "2487206", name: "PEDRO HENRIQUE CHAGAS DA ROSA", gender: "MASCULINO", birth: "2011-08-07", enrollment: "2026-01-19" },
  { reg: "2068810", name: "RAFAEL DOS SANTOS LEMOS", gender: "MASCULINO", birth: "2012-01-26", enrollment: "2026-01-19" },
  { reg: "1997429", name: "STEFANY PEREIRA DA SILVA SIMPLICIO", gender: "FEMININO", birth: "2010-05-25", enrollment: "2026-01-19" },
  { reg: "2436458", name: "VICTOR GABRIEL DIAS CARON", gender: "MASCULINO", birth: "2011-08-15", enrollment: "2026-01-19" },
  { reg: "2423591", name: "YURI FAUSTINO MENDES", gender: "MASCULINO", birth: "2011-05-02", enrollment: "2026-01-19" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", gender: "MASCULINO", birth: "2011-05-10", enrollment: "2026-03-20" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 9\u00ba ANO A ---');
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
