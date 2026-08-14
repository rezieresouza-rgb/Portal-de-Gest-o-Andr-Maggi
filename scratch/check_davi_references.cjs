const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReferences() {
  const id1 = '178df977-e6f8-4ed2-86c5-57a6d88aac99'; // Reg 2726402 (Created 2026-07-30)
  const id2 = '834f3f5f-d5ba-4e4c-bcf8-2447b79b8123'; // Reg 2725402 (Created 2026-04-07)

  console.log("=== CHECKING REFERENCES FOR RECORD 1 (2726402 - 178df977) ===");
  
  const tables = [
    'enrollments',
    'pedagogical_occurrences',
    'teacher_occurrences',
    'fatos_observados',
    'psychosocial_referrals',
    'busca_ativa_cases',
    'special_education_pdi'
  ];

  for (const t of tables) {
    try {
      const { data: res1 } = await supabase.from(t).select('*').or(`student_id.eq.${id1},student_id.eq.${id2}`);
      if (res1 && res1.length > 0) {
        console.log(`Table '${t}' has ${res1.length} records:`, res1.map(r => ({ id: r.id, student_id: r.student_id })));
      }
    } catch (e) {
      // table might not exist or column might differ
    }
  }
}

checkReferences();
