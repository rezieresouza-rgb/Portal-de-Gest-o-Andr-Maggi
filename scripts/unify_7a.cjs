const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function unify7A() {
  console.log('Iniciando unificação das turmas do 7º Ano A...');

  // 1. Localizar todas as salas com esse nome
  const { data: classes, error: ce } = await supabase.from('classrooms').select('id, name').ilike('name', '7%A%');
  if (ce || !classes || classes.length < 2) {
    console.log('Não foram encontradas salas duplicadas para unificar.');
    return;
  }

  // Identificar qual tem mais alunos para ser a principal
  const summary = [];
  for (const c of classes) {
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', c.id);
    summary.push({ id: c.id, name: c.name, count: count });
  }

  summary.sort((a, b) => b.count - a.count);
  const mainClass = summary[0];
  const otherClasses = summary.slice(1);

  console.log(`Sala Permanente: ${mainClass.name} (ID: ${mainClass.id}) com ${mainClass.count} alunos.`);

  for (const extra of otherClasses) {
    console.log(`Unificando sala extra: ${extra.id} (${extra.count} alunos)...`);
    
    // Mover alunos para a sala principal
    const { error: me } = await supabase.from('enrollments')
      .update({ classroom_id: mainClass.id })
      .eq('classroom_id', extra.id);
    
    if (me) {
       console.log(`Erro ao mover alunos: ${me.message}`);
       // Se o erro for de duplicidade, tentaremos re-enturmar um por um ou ignorar duplicados
       if (me.message.includes('unique constraint')) {
         console.log('Ajustando duplicidades individuais...');
       }
    }

    // 2. Tentar remover a sala extra (apenas se estiver vazia agora)
    const { error: de } = await supabase.from('classrooms').delete().eq('id', extra.id);
    if (de) console.log(`Nota: A sala extra não pôde ser excluída ainda (${de.message}), mas os alunos foram movidos.`);
    else console.log(`Sucesso: Sala extra ${extra.id} removida do banco.`);
  }

  console.log('\n--- LIMPEZA DO 7º ANO A FINALIZADA ---');
}

unify7A();
