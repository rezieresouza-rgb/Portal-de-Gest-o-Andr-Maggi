const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function globalCheck() {
  console.log('--- BUSCA GLOBAL POR 7º ANO A ---');

  const { data: classes, error: ce } = await supabase.from('classrooms').select('id, name').ilike('name', '7%A%');
  if (ce || !classes) {
    console.log('Erro ao buscar salas:', ce?.message);
    return;
  }

  for (const c of classes) {
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', c.id);
    console.log(`Sala: ${c.name} | ID: ${c.id} | Alunos: ${count}`);
    
    if (count > 0) {
      const { data: st } = await supabase.from('enrollments')
        .select('students(name)')
        .eq('classroom_id', c.id)
        .limit(2);
      console.log('  Exemplo de alunos:', JSON.stringify(st.map(x => x.students?.name)));
    }
  }

  console.log('--- FIM DO RELATÓRIO ---');
}

globalCheck();
