const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function verify() {
  const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', '6º ANO A').single();
  const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('classroom_id', classroom.id);
  console.log(`Class: 6º ANO A - Total Students Enrolled: ${count}`);
}
verify();
