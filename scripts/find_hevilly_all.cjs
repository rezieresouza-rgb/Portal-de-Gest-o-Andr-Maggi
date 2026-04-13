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

async function findHevillyAll() {
  console.log("Searching for HEVILLY in students table...");
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%HEVILLY%');

  console.log("Found students:", JSON.stringify(students, null, 2));

  for (const s of students) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, classroom_id, classrooms(name, year)')
      .eq('student_id', s.id);
    console.log(`Student ID: ${s.id} | Name: ${s.name} | Enrollments: ${JSON.stringify(enrollments, null, 2)}`);
  }

  // Also check enrollments in 7B that might have broken student links
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', '7º ANO B')
    .eq('year', '2026')
    .maybeSingle();

  if (classroom) {
    console.log(`Checking all enrollments for 7B (ID: ${classroom.id})...`);
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('id, student_id, students(name)')
      .eq('classroom_id', classroom.id);
    
    enrolls.forEach(e => {
      if (!e.students) {
        console.log(`Broken enrollment found! ID: ${e.id} | StudentID: ${e.student_id}`);
      }
    });
  }
}

findHevillyAll();
