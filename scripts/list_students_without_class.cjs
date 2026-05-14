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

async function listWithoutClass() {
  try {
    console.log("Buscando todos os alunos cadastrados no banco de dados...\n");

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
          status,
          enrollments (
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

    console.log(`Total de alunos cadastrados na base: ${allStudents.length}\n`);

    const semMatriculaAlguma = [];
    const apenasInativos = [];

    for (const st of allStudents) {
      const enrs = st.enrollments || [];
      if (enrs.length === 0) {
        semMatriculaAlguma.push(st);
      } else {
        // Verificar se possui alguma matrícula ATIVA ou RECLASSIFICADA
        const hasActive = enrs.some(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
        if (!hasActive) {
          apenasInativos.push(st);
        }
      }
    }

    // Ordenar alfabeticamente
    semMatriculaAlguma.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    apenasInativos.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`=== ALUNOS SEM NENHUMA TURMA VINCULADA (${semMatriculaAlguma.length}) ===`);
    if (semMatriculaAlguma.length === 0) {
      console.log("  Nenhum aluno nesta condição.");
    } else {
      semMatriculaAlguma.forEach((st, idx) => {
        console.log(`  ${String(idx + 1).padStart(3, '0')}. [${st.registration_number}] ${st.name}`);
      });
    }

    console.log(`\n=== ALUNOS APENAS COM HISTÓRICO INATIVO (TRANSFERIDOS/DESLIGADOS) (${apenasInativos.length}) ===`);
    if (apenasInativos.length === 0) {
      console.log("  Nenhum aluno nesta condição.");
    } else {
      apenasInativos.forEach((st, idx) => {
        const hist = st.enrollments.map(e => `${e.classrooms?.name || 'Desconhecida'} (${e.status})`).join(', ');
        console.log(`  ${String(idx + 1).padStart(3, '0')}. [${st.registration_number}] ${st.name} -> Histórico: ${hist}`);
      });
    }

  } catch (err) {
    console.error("Erro ao listar alunos sem turma:", err.message);
  }
}

listWithoutClass();
