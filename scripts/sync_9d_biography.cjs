const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '6126c0dd-efbf-478b-9e61-4353af06ae5a'; // 9º ANO D

const biographyData = [
  { reg: "2436145", name: "ALAN REBUSSI DOMINGUES", gender: "MASCULINO", birth: "2011-03-15" },
  { reg: "2235064", name: "ANDERSON RIBEIRO DA SILVA", gender: "MASCULINO", birth: "2011-07-07" },
  { reg: "2057496", name: "ANDRESSA OLIVEIRA DOMINGOS", gender: "FEMININO", birth: "2012-03-11" },
  { reg: "2343688", name: "CAIQUE CARDOSO DOS SANTOS", gender: "MASCULINO", birth: "2010-01-29" },
  { reg: "2328374", name: "DANIEL RIBEIRO DE SOUZA", gender: "MASCULINO", birth: "2011-11-04" },
  { reg: "2482022", name: "DOUGLAS DE SOUZA BACHIEGA", gender: "MASCULINO", birth: "2012-01-18" },
  { reg: "2105151", name: "EDUARDO GONSALVES FERREIRA", gender: "MASCULINO", birth: "2010-08-21" },
  { reg: "2452301", name: "EMANUELLY VITORIA ALONSO FELIX", gender: "FEMININO", birth: "2011-08-22" },
  { reg: "2396159", name: "ENZO GABRIEL MOREIRA DA SILVA", gender: "MASCULINO", birth: "2011-08-01" },
  { reg: "2499840", name: "FERNANDO GABRIEL MACHADO LEITE", gender: "MASCULINO", birth: "2011-08-04" },
  { reg: "2169362", name: "GUSTAVO GABRIEL DOS SANTOS SILVA", gender: "MASCULINO", birth: "2011-07-14" },
  { reg: "1977496", name: "GUSTAVO HENRIQUE DA SILVA ALVES", gender: "MASCULINO", birth: "2011-03-17" },
  { reg: "1684109", name: "IRENGRA TI PI-YKRE METUKTIRE", gender: "FEMININO", birth: "2011-12-19" },
  { reg: "2048893", name: "ISABELLA ZANOVELLO DA SILVA", gender: "FEMININO", birth: "2012-02-01" },
  { reg: "2436046", name: "ITHALO APARECIDO GRANZIERI DE SOUZA", gender: "MASCULINO", birth: "2012-03-30" },
  { reg: "2436081", name: "JO\u00c3O PEDRO BARROS NAVA", gender: "MASCULINO", birth: "2012-04-04" },
  { reg: "2113039", name: "JO\u00c3O VICTOR DE SOUZA CAVALCANTE", gender: "MASCULINO", birth: "2011-03-22" },
  { reg: "2298572", name: "JULIO CESAR PERTELI BATISTA", gender: "MASCULINO", birth: "2011-05-09" },
  { reg: "2048598", name: "LUAN BARBOSA GON\u00c7ALVES", gender: "MASCULINO", birth: "2012-02-01" },
  { reg: "2050704", name: "LUANA GABRIELA DE SOUZA DIAS", gender: "FEMININO", birth: "2011-11-19" },
  { reg: "2097232", name: "MARIA VIT\u00d3RIA GONZAGA", gender: "FEMININO", birth: "2011-09-20" },
  { reg: "2057543", name: "MILENA GABRIELLY DE SANTANA NOGUEIRA", gender: "FEMININO", birth: "2012-03-22" },
  { reg: "2429260", name: "PAULA FERNANDA VIEIRA DA SILVA", gender: "FEMININO", birth: "2011-05-19" },
  { reg: "2413160", name: "PEDRO MAY DA SILVA", gender: "MASCULINO", birth: "2011-10-22" },
  { reg: "2044686", name: "PEDRO MIGUEL DOS SANTOS DA SILVA", gender: "MASCULINO", birth: "2011-06-28" },
  { reg: "2051314", name: "RENATO DOS SANTOS MOTA", gender: "MASCULINO", birth: "2011-12-26" },
  { reg: "2343118", name: "RUAN GABRIEL RODRIGUES", gender: "MASCULINO", birth: "2010-09-30" },
  { reg: "2087068", name: "THAINARA LAIS BATISTA", gender: "FEMININO", birth: "2012-03-14" },
  { reg: "2437184", name: "WADYSTON NUNES DE ALMEIDA", gender: "MASCULINO", birth: "2012-03-09" },
  { reg: "2085176", name: "WEYDYKATXI TAPAIUNA METUKTIRE", gender: "MASCULINO", birth: "2012-01-22" }
];

async function syncBiography() {
  console.log('--- ATUALIZANDO BIOGRAFIA 9\u00ba ANO D ---');
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
