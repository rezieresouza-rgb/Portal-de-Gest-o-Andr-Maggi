const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function listAll() {
  const { data: rooms } = await supabase.from('classrooms').select('*').order('name');
  console.log("CLASSROOM LIST:");
  for (const r of rooms) {
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', r.id);
    console.log(`ID: ${r.id} | Name: "${r.name}" | Year: ${r.year} | Shift: ${r.shift} | Students: ${count}`);
  }
}
listAll();
