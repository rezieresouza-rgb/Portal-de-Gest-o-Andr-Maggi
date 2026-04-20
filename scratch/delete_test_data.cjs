require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const usersToDelete = [
    'da54c331-08a1-4cd3-9a41-2f104e1e1ac2', // Prof. Cristiano
    '3055f945-fd3b-4b37-a4dd-052f42f5aa08'  // TESTE RLS SUCESSO
  ];

  for (const userId of usersToDelete) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error(`Error deleting user ${userId}:`, error);
    } else {
      console.log(`Deleted user ${userId}`);
    }
  }

  // Also check if there are test referrals or cases that we should delete
  // Is there any case from Cristiano? We checked earlier and found 0.
  // We can also delete cases where student_name = 'TESTE' or something.
  const { data: testCases, error: errCases } = await supabase.from('mediation_cases').select('id, student_name').ilike('student_name', '%teste%');
  if (testCases && testCases.length > 0) {
    for (const c of testCases) {
      await supabase.from('mediation_cases').delete().eq('id', c.id);
      console.log('Deleted test mediation case:', c.student_name);
    }
  }

  const { data: testReferrals, error: errRefs } = await supabase.from('psychosocial_referrals').select('id, student_name').ilike('student_name', '%teste%');
  if (testReferrals && testReferrals.length > 0) {
    for (const r of testReferrals) {
      await supabase.from('psychosocial_referrals').delete().eq('id', r.id);
      console.log('Deleted test psychosocial referral:', r.student_name);
    }
  }
}

main();
