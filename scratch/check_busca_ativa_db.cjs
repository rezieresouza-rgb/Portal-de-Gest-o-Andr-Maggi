require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Checking tables for Busca Ativa...");
  
  // Checking attendance_logs
  const { data: logs, error: logsError } = await supabase.from('attendance_logs').select('*').limit(1);
  console.log("Attendance Logs Sample:", logs?.[0]);

  // Checking students for context
  const { data: students, error: studentsError } = await supabase.from('students').select('*').limit(1);
  console.log("Students Sample:", students?.[0]);
  
  // Any other relevant tables?
  // Let's check for "protocols" or similar
}

main();
