const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function find6th() {
  const { data: rooms } = await supabase.from('classrooms').select('*').ilike('name', '%6%');
  console.log("6th Year Classrooms:");
  for (const r of rooms) {
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
    console.log(`- "${r.name}" | Yr: ${r.year} | ID: ${r.id} | Students: ${count}`);
  }
}
find6th();
