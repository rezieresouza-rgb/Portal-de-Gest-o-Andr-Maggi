const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Dados completos do SIGEEDUCA - Relação de Alunos com Idade - 7º ANO B
// Total: 29 alunos
const students7B = [
  { registration: "2703254", name: "AMANDA ESTEFANY RIQUEIRA DA SILVA",           birth: "2013-06-13" },
  { registration: "2322134", name: "ANA BEATRIZ PEREIRA MENDES DOS SANTOS",       birth: "2013-11-13" },
  { registration: "2664323", name: "ANNA LAURA SILVA RIBEIRO",                    birth: "2013-08-21" },
  { registration: "2684937", name: "BRENDO HENRIQUE DE OLIVEIRA NOVAIS",          birth: "2013-12-24" },
  { registration: "2144507", name: "CLEIDIANE SOARES RODRIGUES",                  birth: "2012-08-04" },
  { registration: "2500821", name: "FELIP APARECIDO BELARMINO",                   birth: "2014-01-31" },
  { registration: "2603484", name: "HEVILLY GARCIA JARDIM",                       birth: "2013-05-31" },
  { registration: "2561700", name: "ISABELLY PEREIRA DE SOUZA",                   birth: "2013-04-12" },
  { registration: "2214158", name: "JO\u00c3O PEDRO SAB\u00d3IA RAMOS",           birth: "2013-08-18" },
  { registration: "2565119", name: "JO\u00c3O VITOR RAMOS DAUBERTO",              birth: "2014-01-25" },
  { registration: "2643141", name: "JOHNNY SOUZA ALMEIDA",                        birth: "2013-11-21" },
  { registration: "2405256", name: "KAIQUE JOS\u00c9 CANDIDO DA SILVA",            birth: "2013-07-02" },
  { registration: "2333472", name: "KAYLA RAFAELA LAGE HORNICH",                  birth: "2013-04-21" },
  { registration: "2417516", name: "KETHELYN SOFIA DE SOUSA DOS SANTOS",          birth: "2013-11-23" },
  { registration: "2243477", name: "KOKON\u00c1 TXUCARRAM\u00c3E",                birth: "2014-02-04" },
  { registration: "2581800", name: "LUIZ FELIPE BRAIDA",                          birth: "2013-04-15" },
  { registration: "2243251", name: "LUKAS GON\u00c7ALVES DOMINGOS",               birth: "2014-02-15" },
  { registration: "2243616", name: "MARIA LARA DAL PUPO DE CARVALHO",             birth: "2014-01-30" },
  { registration: "2557454", name: "MARIA VITORIA DA SILVA SOUZA",                birth: "2014-06-23" },
  { registration: "2207801", name: "MIGUEL SEICENTOS DE LIMA",                    birth: "2013-08-02" },
  { registration: "2663950", name: "MIKAELLY SANTOS AZEVEDO",                     birth: "2013-07-03" },
  { registration: "2207901", name: "MURILO SEICENTOS DE LIMA",                    birth: "2013-08-02" },
  { registration: "2660175", name: "MYCELLENE APARECIDA DOS SANTOS",              birth: "2013-08-04" },
  { registration: "2581804", name: "PEDRO HENRIQUE REBOU\u00c7AS BALCO",          birth: "2013-04-03" },
  { registration: "2243881", name: "TAKAKAJYHY METUKTIRE",                        birth: "2012-11-21" },
  { registration: "2640205", name: "THIAGO GOMES FERREIRA",                       birth: "2011-04-02" },
  { registration: "2210225", name: "VITOR DANIEL ARQUINO BATISTA",                birth: "2013-12-05" },
  { registration: "2566148", name: "YASMIN VITORIA DE AZEVEDO",                   birth: "2013-05-23" },
  { registration: "2682310", name: "YASMIN VIT\u00d3RIA DO NASCIMENTO FIGUEIREDO",birth: "2014-05-28" },
];

async function updateBirthDates() {
  console.log('Atualizando datas de nascimento do 7\u00ba ANO B...\n');
  let ok = 0, notFound = 0, erros = 0;

  for (const s of students7B) {
    const { data: existing, error: findErr } = await supabase
      .from('students')
      .select('id, name, birth_date')
      .eq('registration_number', s.registration)
      .maybeSingle();

    if (findErr) { process.stdout.write(`  ERR ${s.registration}: ${findErr.message}\n`); erros++; continue; }
    if (!existing) { process.stdout.write(`  NAO ENCONTRADO: ${s.registration} - ${s.name}\n`); notFound++; continue; }

    const nameChanged = existing.name !== s.name;
    const dateChanged = existing.birth_date !== s.birth;

    if (!nameChanged && !dateChanged) {
      process.stdout.write(`  OK (sem mudan\u00e7a): ${s.name}\n`);
      ok++;
      continue;
    }

    const updatePayload = { birth_date: s.birth };
    if (nameChanged) updatePayload.name = s.name;

    const { error: upErr } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', existing.id);

    if (upErr) {
      process.stdout.write(`  ERR ao atualizar ${s.name}: ${upErr.message}\n`);
      erros++;
    } else {
      const changes = [];
      if (dateChanged) changes.push(`data: ${existing.birth_date} \u2192 ${s.birth}`);
      if (nameChanged) changes.push(`nome: "${existing.name}" \u2192 "${s.name}"`);
      process.stdout.write(`  \u2713 ${s.name} [${changes.join(' | ')}]\n`);
      ok++;
    }
  }

  console.log(`\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
  console.log(`  OK: ${ok}  |  N\u00e3o encontrados: ${notFound}  |  Erros: ${erros}`);
  console.log(`\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
}

updateBirthDates().catch(e => console.error('FATAL:', e.message));
