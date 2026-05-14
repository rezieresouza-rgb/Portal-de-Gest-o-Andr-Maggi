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

async function deleteRemainingGhosts() {
  try {
    console.log("Iniciando exclusão final dos cadastros com erros de grafia/sem enturmação...\n");

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
          enrollments (id)
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

    // Filtrar apenas alunos com ZERO enturmações (exatamente os 41 da categoria 1)
    const emptyStudents = allStudents.filter(st => !st.enrollments || st.enrollments.length === 0);

    console.log(`Encontrados ${emptyStudents.length} cadastros sem nenhum vínculo de enturmação na base.`);
    console.log("Procedendo com a exclusão definitiva autorizada...\n");

    let successCount = 0;
    let failCount = 0;

    for (const st of emptyStudents) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', st.id);

      if (error) {
        failCount++;
        console.log(`❌ Não foi possível excluir "${st.name}" [${st.registration_number?.trim() || 'S/N'}]: ${error.message}`);
      } else {
        successCount++;
        console.log(`🗑️ Removido: "${st.name}" | Matrícula: [${st.registration_number?.trim() || 'S/N'}]`);
      }
    }

    console.log(`\n=== RESULTADO DA LIMPEZA FINAL ===`);
    console.log(`Cadastros com erros de grafia/vazios excluídos com sucesso: ${successCount}`);
    if (failCount > 0) {
      console.log(`Cadastros retidos por dependências externas: ${failCount}`);
    }
    console.log(`A categoria de alunos sem matrícula foi completamente zerada/enxugada!`);

  } catch (err) {
    console.error("Erro fatal durante exclusão final:", err.message);
  }
}

deleteRemainingGhosts();
