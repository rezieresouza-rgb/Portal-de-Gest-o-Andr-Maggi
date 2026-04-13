const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = 'dfbffcc2-c598-4bca-bcbc-d8bc4eef22f3'; // 9º ANO E

const biographyData = [
  { reg: "2050582", name: "ADRYAN GABRIEL BEZERRA FERRANTE", gender: "MASCULINO", birth: "2012-01-05" },
  { reg: "2050276", name: "AMANDA GABRIELLY CARDOSO DA SILVA", gender: "FEMININO", birth: "2011-05-02" },
  { reg: "2437739", name: "ANA BEATRIZ DOS SANTOS SILVA", gender: "FEMININO", birth: "2011-11-22" },
  { reg: "2436577", name: "ANA CLARA FIERI MANSANO", gender: "FEMININO", birth: "2012-03-08" },
  { reg: "2436528", name: "ANA MARIA PEREIRA DE OLIVEIRA", gender: "FEMININO", birth: "2012-03-13" },
  { reg: "2429308", name: "ARTHUR SERGIO DORINI PEREIRA", gender: "MASCULINO", birth: "2011-01-02" },
  { reg: "2048569", name: "CLARA CASSIMIRO LEITE DOS SANTOS", gender: "FEMININO", birth: "2011-09-29" },
  { reg: "2489093", name: "DAVI SANTOS SOARES", gender: "MASCULINO", birth: "2011-07-01" },
  { reg: "1983765", name: "DIEGO JUNIO MARTINS DE ARA\u00daJO", gender: "MASCULINO", birth: "2010-08-19" },
  { reg: "2035427", name: "ELIANA CRISTINA PEREIRA GIZONI", gender: "FEMININO", birth: "2011-06-30" },
  { reg: "2429314", name: "EMANUELY TONON MOREIRA DA SILVA", gender: "FEMININO", birth: "2011-09-12" },
  { reg: "2050211", name: "EMILLY CAUANI ALVES BISPO", gender: "FEMININO", birth: "2011-12-08" },
  { reg: "2429327", name: "JO\u00c3O VICTOR DOS SANTOS BORGES", gender: "MASCULINO", birth: "2011-08-01" },
  { reg: "1991538", name: "KAMIHA METUKTIRE", gender: "FEMININO", birth: "2011-01-27" },
  { reg: "2342762", name: "KAUANY SANITA CANGU\u00c7U", gender: "FEMININO", birth: "2012-03-21" },
  { reg: "2043254", name: "KETHELLEN NORAINY PEREIRA NETO", gender: "FEMININO", birth: "2011-05-31" },
  { reg: "2140547", name: "LARA BEATRIZ SALGADO RIBEIRO", gender: "FEMININO", birth: "2011-11-09" },
  { reg: "2417324", name: "LORENA AUGUSTO GOMES", gender: "FEMININO", birth: "2012-03-27" },
  { reg: "2053612", name: "LUCAS PERES SERDEIRA", gender: "MASCULINO", birth: "2011-08-26" },
  { reg: "1989168", name: "LUIZ ANTONIO DA SILVA DE SOUZA", gender: "MASCULINO", birth: "2011-12-27" },
  { reg: "2429340", name: "MARIA EDUARDA BACHIEGA DA COSTA", gender: "FEMININO", birth: "2011-09-23" },
  { reg: "2429251", name: "MARYA ISABEL DA SILVA PRADO", gender: "FEMININO", birth: "2012-03-26" },
  { reg: "2048425", name: "NADHELLY VITORIA MORAES DA COSTA FERREIRA", gender: "FEMININO", birth: "2012-02-17" },
  { reg: "2429250", name: "PEDRO HENRIQUE DE SANTANA GUIMAR\u00c3ES", gender: "MASCULINO", birth: "2011-07-27" },
  { reg: "2051329", name: "PEDRO HENRIQUE SOARES GOMES", gender: "MASCULINO", birth: "2012-01-27" },
  { reg: "2045918", name: "THAIS LARISSA BATISTA", gender: "FEMININO", birth: "2012-03-14" },
  { reg: "2429282", name: "VICTOR GABRIEL SANTOS CAVALCANTE", gender: "MASCULINO", birth: "2011-07-28" },
  { reg: "2439390", name: "VIT\u00d3RIA CAZELATO VALERIANO", gender: "FEMININO", birth: "2011-07-25" },
  { reg: "2436792", name: "YASMIM VITORIA FREITAS WEIDLICH", gender: "FEMININO", birth: "2011-08-15" },
  { reg: "2048360", name: "CLAUDEMIR ADRIAM CALIXTO BIFI", gender: "MASCULINO", birth: "2011-05-10" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 9\u00ba ANO E ---');
  let count = 0;

  for (const s of biographyData) {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .update({
        name: s.name.toUpperCase(),
        gender: s.gender,
        birth_date: s.birth
      })
      .eq('registration_number', s.reg)
      .select('id')
      .single();

    if (studentError) {
      console.error(`\u274c Erro ${s.reg}:`, studentError.message);
      continue;
    }

    process.stdout.write('.');
    count++;
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados com biografia.`);
}

syncBiography();
