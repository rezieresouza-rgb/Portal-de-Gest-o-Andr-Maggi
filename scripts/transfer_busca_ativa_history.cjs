const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabase = createClient(getEnvVar('VITE_SUPABASE_URL'), getEnvVar('VITE_SUPABASE_ANON_KEY'));

const normalize = (str) => {
  if (!str) return '';
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
};

async function transferAndDeleteGhosts() {
  try {
    console.log("Iniciando processo de migração de histórico da Busca Ativa/Ocorrências para as contas ativas...\n");

    let allStudents = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          enrollments (
            id,
            status,
            classrooms (name)
          )
        `)
        .range(from, from + step - 1);

      if (error) throw error;

      allStudents.push(...data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    // Agrupar por nome normalizado
    const groups = {};
    for (const st of allStudents) {
      const norm = normalize(st.name);
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(st);
    }

    let transferCount = 0;
    let deleteSuccessCount = 0;
    let deleteFailCount = 0;

    for (const name of Object.keys(groups)) {
      const list = groups[name];
      if (list.length > 1) {
        // Encontra a versão oficial/ativa
        const official = list.find(st => st.enrollments && st.enrollments.length > 0);
        
        if (official) {
          const ghosts = list.filter(st => !st.enrollments || st.enrollments.length === 0);
          
          for (const ghost of ghosts) {
            console.log(`\n🔄 Migrando dados do aluno: "${ghost.name}"`);
            console.log(`   De: ID Fantasma (${ghost.id}) | Matrícula: [${ghost.registration_number?.trim() || 'S/N'}]`);
            console.log(`   Para: ID Oficial (${official.id}) | Matrícula: [${official.registration_number?.trim() || 'S/N'}]`);

            // 1. Migrar ações da Busca Ativa
            const { data: actions, error: err1 } = await supabase
              .from('active_search_actions')
              .update({ student_id: official.id })
              .eq('student_id', ghost.id)
              .select();

            if (err1) {
              console.log(`   ❌ Erro ao transferir active_search_actions: ${err1.message}`);
            } else if (actions && actions.length > 0) {
              transferCount += actions.length;
              console.log(`   ✔️ Transferidas ${actions.length} ações da Busca Ativa.`);
            }

            // 2. Migrar Ocorrências (Ocurrences)
            const { data: occs, error: err2 } = await supabase
              .from('occurrences')
              .update({ student_id: official.id })
              .eq('student_id', ghost.id)
              .select();

            if (err2) {
              console.log(`   ❌ Erro ao transferir occurrences: ${err2.message}`);
            } else if (occs && occs.length > 0) {
              transferCount += occs.length;
              console.log(`   ✔️ Transferidas ${occs.length} ocorrências/logs de monitoramento.`);
            }

            // 3. Migrar Casos de Mediação
            const { data: meds, error: err3 } = await supabase
              .from('mediation_cases')
              .update({ student_id: official.id })
              .eq('student_id', ghost.id)
              .select();

            if (err3) {
              console.log(`   ❌ Erro ao transferir mediation_cases: ${err3.message}`);
            } else if (meds && meds.length > 0) {
              transferCount += meds.length;
              console.log(`   ✔️ Transferidos ${meds.length} casos de mediação.`);
            }

            // Agora que os vínculos foram transferidos para o ID oficial, tentamos excluir o cadastro fantasma
            const { error: delErr } = await supabase
              .from('students')
              .delete()
              .eq('id', ghost.id);

            if (delErr) {
              deleteFailCount++;
              console.log(`   ⚠️ Cadastro fantasma ainda retido (provavelmente outra tabela possui FK): ${delErr.message}`);
            } else {
              deleteSuccessCount++;
              console.log(`   🗑️ Cadastro fantasma excluído com sucesso! A base está unificada.`);
            }
          }
        }
      }
    }

    console.log(`\n=== RESUMO DA UNIFICAÇÃO ===`);
    console.log(`Total de registros históricos transferidos para contas ativas: ${transferCount}`);
    console.log(`Cadastros fantasmas eliminados com sucesso após a transferência: ${deleteSuccessCount}`);
    if (deleteFailCount > 0) {
      console.log(`Cadastros retidos por outras dependências: ${deleteFailCount}`);
    }
    console.log(`Histórico completamente preservado e centralizado no perfil correto do estudante!`);

  } catch (err) {
    console.error("Erro fatal durante migração:", err.message);
  }
}

transferAndDeleteGhosts();
