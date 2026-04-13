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

async function auditHevilly() {
  console.log("--- COMPREHENSIVE HEVILLY AUDIT ---");
  
  // 1. Search all students by name
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%HEVILLY%');
  
  if (studentError) {
    console.error("Error fetching students:", studentError);
    return;
  }
  
  console.log(`Found ${students.length} student records:`);
  for (const s of students) {
    console.log(`- ID: ${s.id} | Name: ${s.name} | Reg: ${s.registration_number} | Status: ${s.status} | Created: ${s.created_at}`);
    
    // Check enrollments for each record
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('id, classroom_id, classrooms(name)')
      .eq('student_id', s.id);
    
    if (enrolls && enrolls.length > 0) {
      console.log(`  Enrollments: ${enrolls.map(e => `${e.classrooms?.name} (${e.classroom_id})`).join(', ')}`);
    } else {
      console.log(`  NO ENROLLMENTS`);
    }
  }

  // 2. Check for any "ghost" enrollments in 7º ANO B (42028b9e...)
  const roomId = '42028b9e-a0c8-41b3-9538-915a9109fe7b';
  const { data: all7B, error: all7BError } = await supabase
    .from('enrollments')
    .select('student_id, students(name, registration_number, status)')
    .eq('classroom_id', roomId);
  
  if (all7BError) {
    console.error("Error fetching 7B enrollments:", all7BError);
  } else {
    console.log(`\n--- ALL ENROLLMENTS IN 7º ANO B (${all7B.length}) ---`);
    for (const e of all7B) {
      if (!e.students) {
         console.log(`! BROKEN ENROLLMENT: Student ID ${e.student_id} (No student record found)`);
      } else if (e.students.name.includes('HEVILLY')) {
         console.log(`* FOUND HEVILLY: ID ${e.student_id} | Name: ${e.students.name} | Status: ${e.students.status}`);
      }
    }
  }
}

auditHevilly();
