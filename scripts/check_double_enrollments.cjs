const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDoubleEnrollments() {
  console.log("=== Checking for potential double enrollments ===");
  
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      registration_number,
      enrollments (
        status,
        enrollment_date,
        classrooms (name)
      )
    `);

  if (error) {
    console.error(error);
    return;
  }

  const issues = [];

  students.forEach(s => {
    const activeEnrollments = (s.enrollments || []).filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
    if (activeEnrollments.length > 1) {
      issues.push({
        name: s.name,
        registration: s.registration_number,
        classes: activeEnrollments.map(e => e.classrooms?.name)
      });
    }
  });

  if (issues.length > 0) {
    console.log(`Found ${issues.length} students with multiple active enrollments:`);
    console.log(JSON.stringify(issues, null, 2));
  } else {
    console.log("No students found with multiple active enrollments.");
  }
}

checkDoubleEnrollments();
