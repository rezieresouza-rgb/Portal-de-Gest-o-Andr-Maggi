const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const birthData = [
  { reg: "2208354", gender: "FEMININO", birth: "2013-09-13" },
  { reg: "2623156", gender: "FEMININO", birth: "2013-11-19" },
  { reg: "2603223", gender: "FEMININO", birth: "2013-06-21" },
  { reg: "2594697", gender: "MASCULINO", birth: "2013-12-24" },
  { reg: "2149607", gender: "FEMININO", birth: "2012-06-04" },
  { reg: "2600921", gender: "MASCULINO", birth: "2014-01-31" },
  { reg: "2600464", gender: "FEMININO", birth: "2013-05-31" },
  { reg: "2594780", gender: "FEMININO", birth: "2013-04-12" },
  { reg: "2214165", gender: "MASCULINO", birth: "2013-06-14" },
  { reg: "2594979", gender: "MASCULINO", birth: "2014-01-25" },
  { reg: "2645141", gender: "MASCULINO", birth: "2013-11-21" },
  { reg: "2405266", gender: "MASCULINO", birth: "2013-07-02" },
  { reg: "2338472", gender: "FEMININO", birth: "2013-04-21" },
  { reg: "2417540", gender: "FEMININO", birth: "2013-11-23" },
  { reg: "2240478", gender: "FEMININO", birth: "2014-03-04" },
  { reg: "2581600", gender: "MASCULINO", birth: "2013-04-15" },
  { reg: "2246251", gender: "MASCULINO", birth: "2014-02-15" },
  { reg: "2348896", gender: "FEMININO", birth: "2014-01-30" },
  { reg: "2597454", gender: "FEMININO", birth: "2014-03-23" },
  { reg: "2207895", gender: "MASCULINO", birth: "2013-06-02" },
  { reg: "2600960", gender: "FEMININO", birth: "2013-07-08" },
  { reg: "2207901", gender: "MASCULINO", birth: "2013-06-02" },
  { reg: "2603175", gender: "FEMININO", birth: "2013-08-04" },
  { reg: "2581604", gender: "MASCULINO", birth: "2013-04-08" },
  { reg: "2243589", gender: "MASCULINO", birth: "2012-11-21" },
  { reg: "2648005", gender: "MASCULINO", birth: "2011-04-02" },
  { reg: "2210229", gender: "MASCULINO", birth: "2013-12-05" },
  { reg: "2596648", gender: "FEMININO", birth: "2013-08-28" },
  { reg: "2652310", gender: "FEMININO", birth: "2014-02-28" }
];

async function updateBirthDates() {
  console.log('--- ATUALIZANDO DATAS DE NASCIMENTO E SEXO 7\u00ba ANO B ---');
  let count = 0;

  for (const s of birthData) {
    const { error } = await supabase
      .from('students')
      .update({
        gender: s.gender,
        birth_date: s.birth
      })
      .eq('registration_number', s.reg);

    if (error) {
      console.error(`\u274c Erro ao atualizar ${s.reg}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n\u2705 Sucesso: ${count} alunos atualizados.`);
}

updateBirthDates();
