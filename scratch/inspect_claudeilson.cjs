const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectClaudeilson() {
  console.log("=== INSPECTING CLAUDEILSON RAMOS RODRIGUES IN DB ===");

  // 1. Search in students table
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))')
    .ilike('name', '%CLAUDEILSON%');

  if (sErr) {
    console.error("Error fetching student:", sErr);
  } else {
    console.log(`Found ${students?.length || 0} students matching 'CLAUDEILSON':`);
    students?.forEach(s => {
      console.log(`- Student ID: ${s.id} | Name: ${s.name} | Registration: ${s.registration_number}`);
      console.log(`  Enrollments (${s.enrollments?.length || 0}):`);
      s.enrollments?.forEach(e => {
        console.log(`    * Enrollment ID: ${e.id} | Status: '${e.status}' | Classroom ID: ${e.classroom_id} | Classroom Name: '${e.classrooms?.name}' | Enrollment Date: ${e.enrollment_date}`);
      });
    });
  }

  // 2. Also search all recent enrollments or students without exact name match
  const { data: allNewStudents } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log("\n=== 10 MOST RECENTLY CREATED STUDENTS IN DB ===");
  allNewStudents?.forEach(s => {
    console.log(`- [${s.id}] ${s.name} (Reg: ${s.registration_number}) | Created: ${s.created_at}`);
    s.enrollments?.forEach(e => {
      console.log(`   -> Status: '${e.status}' | Class: '${e.classrooms?.name}'`);
    });
  });
}

inspectClaudeilson();
