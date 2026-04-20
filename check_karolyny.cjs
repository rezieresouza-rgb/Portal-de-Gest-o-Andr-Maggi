const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('\n--- mediation_cases para ANY KAROLYNY ---');
  const { data: cases, error: casesErr } = await supabase
    .from('mediation_cases')
    .select('id, student_name, student_id, feedback, opened_at, status')
    .ilike('student_name', '%KAROLYNY%');
  
  if (casesErr) console.error('Erro:', casesErr.message);
  else {
    console.log('Total encontrado:', cases?.length || 0);
    cases?.forEach(c => {
      console.log(`  ID: ${c.id}`);
      console.log(`  Nome: ${c.student_name}`);
      console.log(`  student_id: ${c.student_id}`);
      console.log(`  feedback: ${c.feedback || '(VAZIO)'}`);
      console.log(`  status: ${c.status}`);
      console.log('---');
    });
  }

  console.log('\n--- psychosocial_referrals para KAROLYNY ---');
  const { data: refs, error: refsErr } = await supabase
    .from('psychosocial_referrals')
    .select('id, student_name, feedback, date, status')
    .ilike('student_name', '%KAROLYNY%');

  if (refsErr) console.error('Erro:', refsErr.message);
  else {
    console.log('Total encontrado:', refs?.length || 0);
    refs?.forEach(r => {
      console.log(`  ID: ${r.id}`);
      console.log(`  Nome: ${r.student_name}`);
      console.log(`  feedback: ${r.feedback || '(VAZIO)'}`);
      console.log(`  status: ${r.status}`);
      console.log('---');
    });
  }

  console.log('\n--- referrals (busca ativa) para KAROLYNY ---');
  const { data: baRefs } = await supabase
    .from('referrals')
    .select('id, student_name, student_code, feedback, type')
    .ilike('student_name', '%KAROLYNY%');
  
  console.log('Total:', baRefs?.length || 0);
  baRefs?.forEach(r => {
    console.log(`  student_code: ${r.student_code}, feedback: ${r.feedback || '(vazio)'}, type: ${r.type}`);
  });
}

check().catch(console.error);
