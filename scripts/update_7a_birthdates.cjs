const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Dados completos do SIGEEDUCA - Relação de Alunos com Idade - 7º ANO A
const students7A = [
  { registration: "2661725", name: "DAVI LUCA BARBOZA MOREIRA",                   birth: "2013-06-09" },
  { registration: "2565180", name: "DHAYYNE LAWINYA GOMES FERREIRA",             birth: "2014-02-13" },
  { registration: "2643822", name: "EMANUELLY MORAES GOMES",                     birth: "2014-08-19" },
  { registration: "2221703", name: "EMANUELLY VITORIA DIAS PRATES",              birth: "2013-04-22" },
  { registration: "2223191", name: "EMILLY VITORIA POCAS DE AMORIM",             birth: "2013-08-01" },
  { registration: "2289546", name: "ENDREW ALVES DE SOUZA",                      birth: "2013-05-29" },
  { registration: "2383040", name: "ENZO DA COSTA LIMA",                         birth: "2013-10-11" },
  { registration: "2664915", name: "ENZO JOS\u00c9 DE SOUZA NICOLETTI",           birth: "2013-11-21" },
  { registration: "2623709", name: "ERYCKSON KAUAM PEREIRA DA SILVA",            birth: "2013-12-13" },
  { registration: "2681822", name: "FABRICIO LEANDRO FLOR VERDADEIRO",           birth: "2013-06-26" },
  { registration: "2381008", name: "FELIPE BONETTI MILHEIRO",                    birth: "2013-07-12" },
  { registration: "2307002", name: "GABRIEL HENRIQUE DUARTE",                    birth: "2013-11-07" },
  { registration: "2321382", name: "GEOVANA KETELLEN NASCIMENTO DA COSTA",       birth: "2014-02-24" },
  { registration: "2327599", name: "GUSTAVO AMORIM DOS SANTOS",                  birth: "2013-06-11" },
  { registration: "2681830", name: "GUSTAVO SILVA FLOR",                         birth: "2013-12-14" },
  { registration: "2221294", name: "HELOISE PEDROTTI RAMOS",                     birth: "2013-05-20" },
  { registration: "2403307", name: "ISABELA SOARES DO BEM",                      birth: "2013-08-22" },
  { registration: "2283314", name: "JO\u00c3O GABRIEL DA SILVA",                 birth: "2013-08-14" },
  { registration: "2393801", name: "JO\u00c3O LUCAS DO NASCIMENTO LIMA",         birth: "2014-09-03" },
  { registration: "2245470", name: "J\u00daLIA RAFAELA GOMES DA CRUZ",           birth: "2013-04-13" },
  { registration: "2380648", name: "KAUAN EDUARDO BITENCOURT",                    birth: "2013-11-27" },
  { registration: "2599022", name: "LORRAYNE SOUZA JACINTO",                     birth: "2013-05-20" },
  { registration: "2389146", name: "NAYANE FERNANDES DA SILVA",                  birth: "2013-05-02" },
  { registration: "2690522", name: "PEDRO HENRIQUE TREVIZAN DA SILVA",           birth: "2013-06-07" },
  { registration: "2213550", name: "SAMELA VITORIA RAMOS ANDRADE",               birth: "2013-08-21" },
  { registration: "2664401", name: "SARAH DOS SANTOS LIMA",                      birth: "2013-08-03" },
  { registration: "2603776", name: "SARAH PEREIRA DE ALMEIDA",                   birth: "2013-11-15" },
  { registration: "2603788", name: "SOPHIA PEREIRA DE ALMEIDA",                  birth: "2013-11-15" },
  { registration: "2664262", name: "TAYNARA FIGUEIREDO VASCON",                  birth: "2014-01-30" },
  { registration: "2155708", name: "VICTTOR HUGO MONTEIRO DE SOUZA",             birth: "2012-07-01" },
];

async function updateBirthDates() {
  console.log('Atualizando datas de nascimento do 7\u00ba ANO A...\n');
  let ok = 0, notFound = 0, erros = 0;

  for (const s of students7A) {
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
      process.stdout.write(`  OK (sem mudança): ${s.name}\n`);
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
