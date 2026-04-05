const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function removeDupe() {
  const dupeId = "fa5f608e-e82b-4ea8-9651-473c583c6325";
  const mainId = "e3707ca3-d72d-473d-a072-afaa2d616906"; // 2026 MATUTINO

  console.log(`Checking Room ${dupeId}...`);
  // Enrollments check
  const { count: enrollments } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', dupeId);
  const { count: occurrences } = await supabase.from('occurrences').select('*', { count: 'exact', head: true }).eq('classroom_id', dupeId);
  const { count: plans } = await supabase.from('lesson_plans').select('*', { count: 'exact', head: true }).eq('classroom_id', dupeId);

  console.log(`- Enrollments in dupe: ${enrollments}`);
  console.log(`- Occurrences in dupe: ${occurrences}`);
  console.log(`- Plans in dupe: ${plans}`);

  // DELETING DUPE
  console.log(`DELETING Room ${dupeId}...`);
  const { error } = await supabase.from('classrooms').delete().eq('id', dupeId);
  
  if (error) {
    console.error("Error deleting room:", error.message);
  } else {
    console.log("DELETED successfully.");
  }

  // Verification
  const { data: final } = await supabase.from('classrooms').select('id, name, year, shift').eq('name', '6º ANO B');
  console.log("FINAL '6º ANO B' ROOMS IN SYSTEM:", final.length);
  final.forEach(f => console.log(`- ID: ${f.id} | Year: ${f.year} | Shift: ${f.shift}`));
}

removeDupe();
