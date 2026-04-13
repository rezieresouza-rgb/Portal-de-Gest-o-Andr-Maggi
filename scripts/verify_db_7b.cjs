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

async function verifyDBCount() {
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', '7º ANO B')
    .eq('year', '2026')
    .maybeSingle();

  if (!classroom) return console.warn("7º ANO B (2026) not found!");

  const { count, data } = await supabase
    .from('enrollments')
    .select('students(name, registration_number)', { count: 'exact' })
    .eq('classroom_id', classroom.id);
  
  console.log(`Total students in DB for 7º ANO B: ${count}`);
  
  const hevilly = data.find(e => e.students.name.includes('HEVILLY') || e.students.registration_number === '260046');
  if (hevilly) {
    console.log(`[FOUND] ${hevilly.students.name} | ${hevilly.students.registration_number}`);
  } else {
    console.log("[NOT FOUND] HEVILLY is NOT in 7º ANO B in the DB!");
  }
}

verifyDBCount();
