const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyCounts() {
  console.log('--- VERIFICANDO CONSISTÊNCIA DE CONTAGEM ---');

  // Logic from SecretariatDashboard.tsx
  const { data: activeE } = await supabase
    .from('enrollments')
    .select('student_id')
    .in('status', ['ATIVO', 'RECLASSIFICADO']);
  
  const secretariatCount = activeE ? new Set(activeE.map(e => e.student_id)).size : 0;
  console.log(`Secretaria (Alunos Ativos): ${secretariatCount}`);

  // Logic from updated useStudents + BuscaAtivaDashboard
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, name, enrollments(status)');

  const activeStudents = allStudents.filter(s => 
    s.enrollments?.[0]?.status === 'ATIVO' || s.enrollments?.[0]?.status === 'RECLASSIFICADO'
  );
  
  const buscaAtivaCount = activeStudents.length;
  console.log(`Busca Ativa (Alunos Ativos): ${buscaAtivaCount}`);

  if (secretariatCount === buscaAtivaCount) {
    console.log('✅ SUCESSO: As contagens estão sincronizadas!');
  } else {
    console.log('❌ ERRO: Discrepância detectada!');
  }
}

verifyCounts();
