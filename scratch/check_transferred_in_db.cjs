const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTransferred() {
  const { data: transferredEnr } = await supabase
    .from('enrollments')
    .select('*, student:students(*), classroom:classrooms(*)')
    .ilike('status', '%TRANSFERIDO%');

  console.log(`\n=== TOTAL DE MATRÍCULAS COM STATUS 'TRANSFERIDO' NO BANCO DE DADOS: ${transferredEnr?.length || 0} ===`);
  transferredEnr?.slice(0, 10).forEach(e => {
    console.log(`- Aluno: ${e.student?.name} (Matrícula: ${e.student?.registration_number}) | Turma: ${e.classroom?.name} | Status: '${e.status}'`);
  });
}

checkTransferred();
