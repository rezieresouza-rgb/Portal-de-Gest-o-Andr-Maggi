const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function verify7D() {
  const { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('name', '7º ANO D')
    .single();

  if (cErr) {
    console.error("7º ANO D not found in classrooms table.");
    return;
  }

  const { count, error: countErr } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroom.id);

  if (countErr) {
    console.error("Error counting enrollments:", countErr.message);
    return;
  }

  console.log(`7º ANO D (ID: ${classroom.id}) found.`);
  console.log(`Total students enrolled: ${count}`);

  const { data: students } = await supabase
     .from('enrollments')
     .select('students(name)')
     .eq('classroom_id', classroom.id);

  console.log("\nStudent List:");
  students.sort((a,b) => a.students.name.localeCompare(b.students.name)).forEach((s, i) => {
     console.log(`${i+1}. ${s.students.name}`);
  });
}

verify7D();
