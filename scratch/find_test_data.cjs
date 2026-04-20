require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Searching for test data...");

  // 1. Check Users table
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%cristiano%');
  
  if (userErr) console.error("Error fetching users:", userErr);
  else console.log("Found test users:", users);

  // 2. Check Referrals table (psychosocial_referrals)
  const { data: referrals, error: refErr } = await supabase
    .from('psychosocial_referrals')
    .select('*')
    .ilike('teacher_name', '%cristiano%');
    
  if (refErr) console.error("Error fetching referrals:", refErr);
  else console.log("Found test referrals:", referrals);

  // 3. Check Mediation Cases table
  const { data: cases, error: caseErr } = await supabase
    .from('mediation_cases')
    .select('*')
    .contains('involved_parties', ['CRISTIANO']); // Might not match exact if lowercase or partial

  if (caseErr) console.error("Error fetching cases:", caseErr);
  else console.log("Found test cases (by array):", cases);
}

main();
