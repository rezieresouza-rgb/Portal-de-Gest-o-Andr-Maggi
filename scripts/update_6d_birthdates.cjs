const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Dados completos do SIGEEDUCA - Relação de Alunos com Idade - 6º ANO D
const students6D = [
  { registration: "2660214", name: "ADRIEL COSTA GONÇALO",                            birth: "2014-07-03" },
  { registration: "2997220", name: "AKEMILLY MARIA BALDANA PALM",                  birth: "2014-04-11" },
  { registration: "2269305", name: "ALLISON VICTOR DOS SANTOS PORTO",              birth: "2014-11-05" },
  { registration: "2997251", name: "ARTHUR DE LIMA SANCHES",                        birth: "2015-01-05" },
  { registration: "3960119", name: "DAVY HENRIQUE BACHIEGA COSTA",                  birth: "2014-06-15" },
  { registration: "2228763", name: "ELOIZA DE SOUZA DIAS",                          birth: "2014-05-29" },
  { registration: "2693188", name: "ENZO VINICIUS ALMONDES DE LIMA",                birth: "2014-07-09" },
  { registration: "2269319", name: "ESTER SANTANA RODRIGUES SANTOS",                birth: "2013-07-24" },
  { registration: "2998402", name: "FELIPE GERMANO BENTO DA SILVA",                 birth: "2014-08-19" },
  { registration: "2966084", name: "GABRIEL PLACIDINO TREVIZAN",                    birth: "2014-05-29" },
  { registration: "2369004", name: "GABRIEL MARTINS LIMA",                          birth: "2015-01-23" },
  { registration: "2323714", name: "GABRIELLY CORREIA DOS SANTOS",                  birth: "2014-05-28" },
  { registration: "3659083", name: "GUSTTAVO HENRIQUE DA COSTA SOUZA",              birth: "2014-07-03" },
  { registration: "2719652", name: "HENRY GABRIEL CARDOSO DORIA",                    birth: "2014-08-22" },
  { registration: "2289816", name: "HUGO BRUNO ARAÚJO DE ALMEIDA",                  birth: "2014-01-15" },
  { registration: "2671289", name: "HIARKLEY VICTOR PAULINO BISPO",                 birth: "2014-12-02" },
  { registration: "2395807", name: "JEAN PAULO SOARES DE OLIVEIRA",                birth: "2014-05-02" },
  { registration: "3965431", name: "JEFERSON TURRA DOS SANTOS",                     birth: "2014-08-23" },
  { registration: "3960138", name: "JOÃO MIGUEL JESUS ARAÚJO THOMÉ",                birth: "2013-10-05" },
  { registration: "2966206", name: "JOÃO VITOR DOS SANTOS MATEUS",                  birth: "2014-11-13" },
  { registration: "2671365", name: "JORGE HENRIQUE PEREIRA DE AZEVEDO",              birth: "2015-02-03" },
  { registration: "2671389", name: "JOYCE DE JESUS DOS SANTOS",                      birth: "2014-10-03" },
  { registration: "2267110", name: "LORIANE DA SILVA BEZERRA",                      birth: "2014-04-19" },
  { registration: "2966259", name: "MARIANA BENICIO COSTA",                          birth: "2015-02-03" },
  { registration: "2326081", name: "MATHEUS DE SOUZA FRANÇA",                      birth: "2015-02-11" },
  { registration: "2289303", name: "PAOLLA LIMA DA SILVA",                          birth: "2014-10-16" },
  { registration: "2965427", name: "SAMUEL LEANDRO DO VALE",                        birth: "2014-04-19" },
  { registration: "2323401", name: "TAKAKPYNETI KAIRAL METUKTIRE",                birth: "2014-06-04" },
  { registration: "2969047", name: "VAN SILVA NUNES",                              birth: "2015-08-23" },
  { registration: "2326902", name: "BEP METUKTIRE",                                birth: "2013-05-05" },
];

async function updateBirthDates() {
  console.log('Atualizando datas de nascimento e nomes do 6\u00ba ANO D...\n');
  let ok = 0, notFound = 0, erros = 0;

  for (const s of students6D) {
    // Tentar buscar por matrícula primeiro
    const { data: existing, error: findErr } = await supabase
      .from('students')
      .select('id, name, birth_date')
      .eq('registration_number', s.registration)
      .maybeSingle();

    if (findErr) { process.stdout.write(`  ERR ${s.registration}: ${findErr.message}\n`); erros++; continue; }
    
    if (!existing) {
      // Se não achou por matrícula, tenta por nome exato (caso a matrícula estivesse errada no script anterior)
      const { data: byName } = await supabase
        .from('students')
        .select('id, name, registration_number, birth_date')
        .ilike('name', `%${s.name}%`)
        .maybeSingle();
      
      if (!byName) {
        process.stdout.write(`  NAO ENCONTRADO: ${s.registration} - ${s.name}\n`);
        notFound++;
        continue;
      }
      
      // Encontrou por nome, atualizar matrícula tbm
      const updatePayload = { 
        birth_date: s.birth,
        registration_number: s.registration,
        name: s.name 
      };
      
      const { error: upErr } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', byName.id);
        
      if (upErr) { process.stdout.write(`  ERR ao atualizar ${s.name}: ${upErr.message}\n`); erros++; }
      else { process.stdout.write(`  ✓ ${s.name} [Recuperado por Nome | Matrícula e Data atualizadas]\n`); ok++; }
      continue;
    }

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
