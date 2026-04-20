require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('students').select('*').limit(1);
  if (error) console.error(error);
  
  // Try to find attendance or busca ativa tables by querying common names
  const tables = ['attendance_logs', 'attendance_records', 'busca_ativa_logs', 'student_attendance', 'absences'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table found: ${table} (Count: ${count})`);
    }
  }
}

main();
