const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectDavi() {
  console.log("=== INSPECTING DAVI CARVALHO SALMENTO IN DB ===");

  // 1. Search in students table
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))')
    .ilike('name', '%DAVI%SALMENTO%');

  if (sErr) {
    console.error("Error fetching student:", sErr);
  } else {
    console.log(`Found ${students?.length || 0} student records matching 'DAVI SALMENTO':`);
    students?.forEach(s => {
      console.log(`\n- Student ID: ${s.id}`);
      console.log(`  Name: '${s.name}'`);
      console.log(`  Registration Number: '${s.registration_number}'`);
      console.log(`  Birth Date: '${s.birth_date}'`);
      console.log(`  Guardian: '${s.guardian_name}'`);
      console.log(`  Created At: '${s.created_at}'`);
      console.log(`  Enrollments (${s.enrollments?.length || 0}):`);
      s.enrollments?.forEach(e => {
        console.log(`    * Enrollment ID: ${e.id} | Status: '${e.status}' | Classroom ID: ${e.classroom_id} | Class Name: '${e.classrooms?.name}' | Enrollment Date: ${e.enrollment_date}`);
      });
    });
  }

  // 2. Also search all enrollments for DAVI SALMENTO
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, student:students(*), classroom:classrooms(*)')
    .or('student_id.in.(' + students?.map(s => s.id).join(',') + ')');

  console.log(`\n=== ALL ENROLLMENT ROWS IN DB (${enrollments?.length || 0}) ===`);
  enrollments?.forEach(e => {
    console.log(`- Enrollment ID: ${e.id} | Student ID: ${e.student_id} (${e.student?.name}) | Class: ${e.classroom?.name} | Status: '${e.status}' | Created At: ${e.created_at}`);
  });
}

inspectDavi();
