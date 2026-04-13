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

async function checkAll7B() {
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .eq('name', '7º ANO B')
    .eq('year', '2026')
    .maybeSingle();

  if (!classroom) return console.error("7º ANO B (2026) NOT FOUND!");

  console.log(`Classroom: ${classroom.name} (Year: ${classroom.year}) ID: ${classroom.id}`);

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, student_id, students(*)')
    .eq('classroom_id', classroom.id)
    .order('id', { ascending: true });

  console.log(`Total enrollments found: ${enrollments.length}`);

  enrollments.forEach((e, i) => {
    const s = e.students;
    console.log(`${i+1}. ${s.name} | Reg: ${s.registration_number} | ID: ${s.id} | Status: ${s.status}`);
    if (s.name.includes('HEVILLY')) {
      console.log(`   >>> TARGET FOUND! <<<`);
    }
  });
}

checkAll7B();
