const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debug6B() {
  console.log("=== Debugging 6º ANO B Students ===");
  
  // 1. Get Classroom ID
  const { data: classrooms, error: classError } = await supabase
    .from('classrooms')
    .select('id, name')
    .ilike('name', '%6%ANO%B%');

  if (classError) {
    console.error("Error fetching classrooms:", classError);
    return;
  }

  console.log("Found Classrooms:", classrooms);

  if (classrooms.length === 0) {
    console.log("Classroom not found.");
    return;
  }

  const classroomId = classrooms[0].id;

  // 2. Get Enrollments
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      status,
      students (
        id,
        name,
        registration_number
      )
    `)
    .eq('classroom_id', classroomId);

  if (enrollError) {
    console.error("Error fetching enrollments:", enrollError);
    return;
  }

  console.log(`Total Enrollments found: ${enrollments.length}`);
  
  const active = enrollments.filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
  console.log(`Active/Reclassified Enrollments: ${active.length}`);

  active.sort((a, b) => a.students.name.localeCompare(b.students.name)).forEach((e, idx) => {
    console.log(`${idx + 1}. [${e.status}] ${e.students.name} (${e.students.registration_number})`);
  });

  const inactive = enrollments.filter(e => e.status !== 'ATIVO' && e.status !== 'RECLASSIFICADO');
  if (inactive.length > 0) {
    console.log("\nInactive Enrollments:");
    inactive.forEach((e, idx) => {
      console.log(`${idx + 1}. [${e.status}] ${e.students.name} (${e.students.registration_number})`);
    });
  }
}

debug6B();
