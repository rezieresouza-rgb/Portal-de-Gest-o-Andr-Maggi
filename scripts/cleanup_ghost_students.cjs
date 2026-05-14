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

async function cleanupGhosts() {
  try {
    console.log("Iniciando varredura para limpeza de duplicatas fantasmas...\n");

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

    const ghostsToDelete = [];

    Object.keys(groups).forEach(name => {
      const list = groups[name];
      if (list.length > 1) {
        // Verificar se existe pelo menos um registro válido (com enturmação ativa ou com histórico real)
        // Vamos considerar "oficial" qualquer registro que possua pelo menos 1 enturmação vinculada
        const officialCopies = list.filter(st => st.enrollments && st.enrollments.length > 0);
        
        if (officialCopies.length > 0) {
          // Se existe cópia oficial, todos os outros registros do mesmo aluno que tenham ZERO enturmações são fantasmas puros
          const pureGhosts = list.filter(st => !st.enrollments || st.enrollments.length === 0);
          
          pureGhosts.forEach(ghost => {
            ghostsToDelete.push({
              id: ghost.id,
              name: ghost.name,
              reg: ghost.registration_number,
              officialRegs: officialCopies.map(o => o.registration_number?.trim()).join(', ')
            });
          });
        }
      }
    });

    console.log(`🧹 Total de registros fantasmas identificados para exclusão segura: ${ghostsToDelete.length}\n`);

    if (ghostsToDelete.length === 0) {
      console.log("Nenhum registro fantasma puro encontrado para deletar.");
      return;
    }

    console.log("Executando exclusão no banco de dados...");
    let successCount = 0;
    let errorCount = 0;

    for (const ghost of ghostsToDelete) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', ghost.id);

      if (error) {
        errorCount++;
        console.log(`❌ Erro ao deletar "${ghost.name}" [${ghost.reg}]: ${error.message}`);
      } else {
        successCount++;
        console.log(`✅ Deletado: "${ghost.name}" | Matrícula Fantasma: [${ghost.reg || 'S/N'}] 👉 Cópia mantida na base: [${ghost.officialRegs}]`);
      }
    }

    console.log(`\n=== RESUMO DA FAXINA ===`);
    console.log(`Sucesso: ${successCount} registros fantasmas removidos permanentemente.`);
    if (errorCount > 0) {
      console.log(`Erros: ${errorCount} registros não puderam ser excluídos (provavelmente possuem dependências em outras tabelas).`);
    }
    console.log(`A lista de alunos Sem Turma foi drasticamente reduzida e otimizada!`);

  } catch (err) {
    console.error("Erro fatal durante a limpeza:", err.message);
  }
}

cleanupGhosts();
