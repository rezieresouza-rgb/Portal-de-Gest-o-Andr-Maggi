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

async function fixHevilly() {
  const roomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b'; // 7º ANO B
  const registrationNumber = '260046';
  
  console.log(`Fixing HEVILLY (Reg: ${registrationNumber}) in 7B...`);

  // 1. Find all student IDs for this name/reg
  const { data: students } = await supabase
    .from('students')
    .select('id, name, registration_number')
    .or(`name.ilike.%HEVILLY%,registration_number.eq.${registrationNumber}`);

  if (!students || students.length === 0) {
    console.error("NO HEVILLY FOUND IN STUDENTS TABLE!");
    return;
  }

  console.log("Matching students in DB:", JSON.stringify(students, null, 2));

  // The one we want is the one with the correct reg number or the first one if multiple
  const correctStudent = students.find(s => s.registration_number === registrationNumber) || students[0];
  const correctId = correctStudent.id;
  console.log(`Definitive ID to use: ${correctId} (${correctStudent.name})`);

  // 2. Identify and remove any existing enrollments for ANY of these IDs in 7B
  for (const s of students) {
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', s.id)
      .eq('classroom_id', roomId);
    
    if (existing && existing.length > 0) {
      console.log(`Removing old enrollment for ID: ${s.id}`);
      await supabase.from('enrollments').delete().eq('student_id', s.id).eq('classroom_id', roomId);
    }
  }

  // 3. Create the clean enrollment
  console.log(`Enrolling ${correctId} into 7B...`);
  const { error: enrollErr } = await supabase
    .from('enrollments')
    .insert({
      student_id: correctId,
      classroom_id: roomId,
      enrollment_date: '2026-02-10'
    });

  if (enrollErr) {
    console.error("Error creating clean enrollment:", enrollErr.message);
  } else {
    console.log("SUCCESS! HEVILLY GARCIA JARDIM is now correctly enrolled.");
  }

  // 4. Verify count
  const { count } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', roomId);
  console.log(`Total students in 7B now: ${count}`);
}

fixHevilly();
