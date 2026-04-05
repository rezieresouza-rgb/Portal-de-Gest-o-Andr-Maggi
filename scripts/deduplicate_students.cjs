/**
 * Script de Deduplicação de Alunos - Portal André Maggi
 * Executa a mesclagem de registros duplicados por Nome + Nascimento.
 * 
 * Uso: node deduplicate_students.cjs [--apply]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const isDryRun = !process.argv.includes('--apply');

async function deduplicate() {
  console.log(`\n🚀 Iniciando Deduplicação (MODO: ${isDryRun ? 'DRY RUN - APENAS LOG' : 'APLICAR NO BANCO'})`);

  try {
    // 1. Buscar todos os alunos
    const { data: allStudents, error: studentError } = await supabase.from('students').select('*');
    if (studentError) throw studentError;

    // 2. Agrupar por Nome Normalizado + Nascimento
    const groups = {};
    allStudents.forEach(s => {
      const key = `${s.name.trim().toUpperCase()}_${s.birth_date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const duplicateGroups = Object.keys(groups).filter(k => groups[k].length > 1);
    console.log(`📊 Grupos Detectados: ${Object.keys(groups).length}`);
    console.log(`⚠️ Grupos com Duplicatas: ${duplicateGroups.length}`);

    let totalMerged = 0;

    for (const key of duplicateGroups) {
      const members = groups[key];
      
      // 3. Eleger Master
      // Prioridade: Matrícula Real (202...), depois a mais antiga (menor created_at)
      let master = members.find(m => m.registration_number && /^20\d+/.test(m.registration_number));
      if (!master) {
          master = members.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))[0];
      }

      const slaves = members.filter(m => m.id !== master.id);
      
      console.log(`\n--- GRUPO: ${members[0].name} (${members[0].birth_date}) ---`);
      console.log(`✅ MASTER: ID=${master.id} Reg=${master.registration_number}`);
      
      for (const slave of slaves) {
        console.log(`❌ DUPLICATA: ID=${slave.id} Reg=${slave.registration_number}`);
        
        if (!isDryRun) {
          // 4. Migrar Vínculos
          const tables = [
            'enrollments',
            'student_movements',
            'grades',
            'occurrences',
            'referrals',
            'active_search_actions'
          ];

          for (const table of tables) {
             const { count, error } = await supabase
                .from(table)
                .update({ student_id: master.id })
                .eq('student_id', slave.id);
             
             if (error) {
                 if (error.code === '23505' && table === 'enrollments') {
                     // Caso ele já esteja matriculado na msm turma, apenas deletar a duplicata da matrícula
                     await supabase.from(table).delete().eq('student_id', slave.id);
                 } else {
                     console.error(`Erro ao migrar ${table}:`, error.message);
                 }
             }
          }

          // 5. Deletar Escravo
          const { error: delError } = await supabase.from('students').delete().eq('id', slave.id);
          if (delError) console.error(`Erro ao deletar aluno:`, delError.message);
          else totalMerged++;
        }
      }
    }

    if (isDryRun) {
      console.log('\n✅ Fim do Log. Rode com --apply para aplicar as mudanças.');
    } else {
      console.log(`\n🏆 Sucesso! ${totalMerged} registros duplicados removidos.`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

deduplicate();
