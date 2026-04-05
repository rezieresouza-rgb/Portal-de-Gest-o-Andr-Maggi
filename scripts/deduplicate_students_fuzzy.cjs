/**
 * Script de Deduplicação Flexível (Fuzzy) de Alunos - Portal André Maggi
 * Executa a mesclagem de registros duplicados apenas pelo Nome (Normalizado).
 * 
 * Uso: node deduplicate_students_fuzzy.cjs [--apply]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const isDryRun = !process.argv.includes('--apply');

const PLACEHOLDER_DATES = ['2014-01-01', '2013-01-01', '2012-01-01', '2015-01-01', '2011-01-01'];

async function fuzzyDeduplicate() {
  console.log(`\n🚀 Iniciando Deduplicação FLEXÍVEL (MODO: ${isDryRun ? 'DRY RUN - APENAS LOG' : 'APLICAR NO BANCO'})`);

  try {
    // 1. Buscar todos os alunos ativos
    const { data: allStudents, error: studentError } = await supabase.from('students').select('*');
    if (studentError) throw studentError;

    // 2. Agrupar apenas por Nome (Normalizado)
    const groups = {};
    allStudents.forEach(s => {
      const key = s.name.trim().toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const duplicateGroups = Object.keys(groups).filter(k => groups[k].length > 1);
    console.log(`📊 Total de Alunos na Base: ${allStudents.length}`);
    console.log(`⚠️ Nomes Duplicados: ${duplicateGroups.length}`);

    let totalMergedCount = 0;

    for (const nameKey of duplicateGroups) {
      const members = groups[nameKey];
      
      // 3. Eleger o "Master"
      // Prioridade 1: Matrícula Real (202...)
      // Prioridade 2: Data de Nascimento que NÃO seja placeholder
      // Prioridade 3: Registro mais antigo
      
      let master = members.find(m => m.registration_number && /^20\d+/.test(m.registration_number));
      
      if (!master) {
          // Se nenhum tem matrícula real, pegar o que não tem data placeholder
          master = members.find(m => !PLACEHOLDER_DATES.includes(m.birth_date));
      }
      
      if (!master) {
          // Fallback: o mais antigo
          master = members.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))[0];
      }

      const slaves = members.filter(m => m.id !== master.id);
      
      console.log(`\n--- GRUPO: ${nameKey} ---`);
      console.log(`✅ MASTER: [ID=${master.id}] [Reg=${master.registration_number}] [Nasc=${master.birth_date}]`);
      
      for (const slave of slaves) {
        console.log(`❌ DUPLICATA: [ID=${slave.id}] [Reg=${slave.registration_number}] [Nasc=${slave.birth_date}]`);
        
        if (!isDryRun) {
          // 4. Migrar Vínculos em tabelas dependentes
          const tables = [
            'enrollments',
            'student_movements',
            'grades',
            'occurrences',
            'referrals',
            'active_search_actions'
          ];

          for (const table of tables) {
             const { error } = await supabase
                .from(table)
                .update({ student_id: master.id })
                .eq('student_id', slave.id);
             
             if (error) {
                 if (error.code === '23505' && table === 'enrollments') {
                     // Conflito de PK (aluno já matriculado no master nesta turma)
                     // Apenas deletamos o vínculo órfão
                     await supabase.from(table).delete().eq('student_id', slave.id);
                 } else {
                     console.error(`Erro ao migrar ${table} (ID=${slave.id} -> ${master.id}):`, error.message);
                 }
             }
          }

          // 5. Deletar Registro Auxiliar (Slave)
          const { error: delError } = await supabase.from('students').delete().eq('id', slave.id);
          if (delError) {
              console.error(`Falha ao remover aluno ${slave.id}:`, delError.message);
          } else {
              totalMergedCount++;
          }
        }
      }
    }

    if (isDryRun) {
      console.log('\n✅ Dry Run Concluído. Analise os grupos acima e rode com --apply para efetivar.');
    } else {
      console.log(`\n🏆 Sucesso! ${totalMergedCount} registros duplicados foram limpos e unificados.`);
    }

  } catch (error) {
    console.error('❌ Erro crítico no processo:', error);
  }
}

fuzzyDeduplicate();
