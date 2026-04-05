const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function deleteForReal() {
  const idToDelete = "12783886-4a61-4898-ace9-dc585483fdf0";
  console.log(`Attempting to delete Room ${idToDelete}...`);

  const tables = ['enrollments', 'occurrences', 'lesson_plans', 'assessments', 'active_search_actions', 'mediation_cases'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('classroom_id', idToDelete);
    if (error) console.log(`Error checking ${t}:`, error.message);
    else console.log(`Table ${t} has ${count} records for this room.`);
  }

  const { error: delErr } = await supabase.from('classrooms').delete().eq('id', idToDelete);
  if (delErr) {
    console.error("DELETE FAILED:", delErr.message, delErr.details, delErr.hint);
  } else {
    console.log("DELETE SUCCESSFUL (according to Supabase).");
  }

  // Double check
  const { data: check } = await supabase.from('classrooms').select('id').eq('id', idToDelete).single();
  if (check) console.log("Room STILL EXISTS after delete!");
  else console.log("Room NO LONGER EXISTS.");
}
deleteForReal();
