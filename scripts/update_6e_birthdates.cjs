const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Dados completos do SIGEEDUCA - Relação de Alunos com Idade - 6º ANO E
// Inclui correção de nomes + datas de nascimento
const students6E = [
  { registration: "2879304", name: "ADRIYAN SOUSA DOS ANJOS",                            birth: "2015-02-21" },
  { registration: "2676657", name: "ANA CLARA DE OLIVEIRA ANDRADE",                      birth: "2015-10-27" },
  { registration: "2390012", name: "ELOISA MOREIRA DONATO",                              birth: "2014-09-01" },
  { registration: "2116781", name: "EMILY VITÓRIA DE ALMEIDA FAUSTINO",                  birth: "2014-10-16" },
  { registration: "2671307", name: "GABRIELA HENRIQUE GIZON DA SILVA",                   birth: "2014-04-14" },
  { registration: "3093380", name: "GREG NOJAN DO AMARAL",                               birth: "2013-02-10" },
  { registration: "3068981", name: "GUILHERME DOS SANTOS AMORIM",                        birth: "2014-12-01" },
  { registration: "2093087", name: "GUILHERME HENRIQUE MOREIRA DA SILVA",                birth: "2014-08-02" },
  { registration: "2971945", name: "HECTOR BEATRIZ DOS SANTOS MARTINS",                  birth: "2014-09-05" },
  { registration: "2671263", name: "JOÃO LUIZ MESQUITA SILVA DOS SANTOS",                birth: "2014-05-03" },
  { registration: "3052584", name: "JOÃO PEDRO FIRMINO DA SILVA",                        birth: "2015-01-05" },
  { registration: "3421444", name: "JOAQUIM LEITE MARCHORO",                             birth: "2014-12-28" },
  { registration: "2675483", name: "JOSE EDUARDO DOURADO DE ARAUJO",                    birth: "2013-11-26" },
  { registration: "2731926", name: "JOSE MARCIO LEMOS CABRAL",                          birth: "2014-08-11" },
  { registration: "2310125", name: "KHYMERILLY KLEIVE VAZ DE OLIVEIRA",                 birth: "2014-10-24" },
  { registration: "2290250", name: "KOKOREJI MARUZA METUKIRE",                          birth: "2014-08-28" },
  { registration: "2277854", name: "LUZ MIGUEL CHAVES MENDONÇA",                        birth: "2014-07-09" },
  { registration: "2297023", name: "MAYRA CLARA FERREIRA DOS SANTOS",                   birth: "2014-01-28" },
  { registration: "2671633", name: "MIKAELY CRISTINA FERREIRA DOS SANTOS",              birth: "2015-09-10" },
  { registration: "2697017", name: "NICOLAS JOSÉ PEREIRA VIANA",                        birth: "2014-11-05" },
  { registration: "3073603", name: "RAYQUE VITOR DOS SANTOS RODRIGUES",                 birth: "2014-12-23" },
  { registration: "3546989", name: "ROSE EMANUELLY ALMEIDA AGUIAR",                     birth: "2014-12-29" },
  { registration: "2312384", name: "RUTE DOS SANTOS MAGOLO",                            birth: "2015-08-11" },
  { registration: "3004352", name: "SAMUEL LUÍS FERREIRA DA SILVA",                     birth: "2014-11-22" },
  { registration: "2475383", name: "VICTOR JOAQUIM MARQUES MADEIRA",                    birth: "2014-08-20" },
  { registration: "2727020", name: "WEYDNE HENRIQUE DOS SANTOS CORREIA",                birth: "2014-11-28" },
  { registration: "3626581", name: "YASMIN MARA VITÓRIA NASCIMENTO DA SILVA PEDROSO",   birth: "2014-01-27" },
  { registration: "2336717", name: "YAYOKE APISTROS DO NASCIMENTO JURUNA",              birth: "2015-09-04" },
  { registration: "3069260", name: "YZANN YOMARA RIBEIRO DE SOUZA",                    birth: "2014-10-31" },
  { registration: "2735279", name: "ALEXANDRE MOURA DOS SANTOS",                        birth: "2014-08-26" },
];

async function updateBirthDates() {
  console.log('Atualizando datas de nascimento do 6\u00ba ANO E...\n');
  let ok = 0, notFound = 0, erros = 0;

  for (const s of students6E) {
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
      if (dateChanged) changes.push(`data: ${existing.birth_date} → ${s.birth}`);
      if (nameChanged) changes.push(`nome: "${existing.name}" → "${s.name}"`);
      process.stdout.write(`  ✓ ${s.name} [${changes.join(' | ')}]\n`);
      ok++;
    }
  }

  console.log(`\n══════════════════════════════════`);
  console.log(`  OK: ${ok}  |  Não encontrados: ${notFound}  |  Erros: ${erros}`);
  console.log(`══════════════════════════════════`);
}

updateBirthDates().catch(e => console.error('FATAL:', e.message));
