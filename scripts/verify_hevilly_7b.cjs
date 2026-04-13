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

async function verifyHevilly() {
  console.log("Searching for HEVILLY GARCIA JARDIM...");
  
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, name, registration_number')
    .ilike('name', '%HEVILLY%');

  if (sErr) return console.error("Error searching student:", sErr);
  
  console.log("Students found:", JSON.stringify(students, null, 2));

  const { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .select('id, name, year')
    .eq('name', '7º ANO B')
    .eq('year', '2026')
    .maybeSingle();

  if (cErr) return console.error("Error searching classroom:", cErr);
  if (!classroom) return console.warn("7º ANO B (2026) not found!");

  console.log(`Classroom: ${classroom.name} (Year: ${classroom.year})`);

  for (const s of students) {
    const { data: enrollment, error: eErr } = await supabase
      .from('enrollments')
      .select('id, student_id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', s.id)
      .maybeSingle();
      
    if (eErr) console.error(`Error checking enrollment for ${s.name}:`, eErr);
    else if (enrollment) console.log(`[YES] ${s.name} (Reg: ${s.registration_number}) IS ENROLLED.`);
    else console.log(`[NO] ${s.name} (Reg: ${s.registration_number}) IS NOT ENROLLED.`);
  }

  const { count } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroom.id);
  
  console.log(`Total students in 7º ANO B: ${count}`);
}

verifyHevilly();
