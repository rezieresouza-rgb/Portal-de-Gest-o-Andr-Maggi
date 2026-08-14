const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function removeDuplicate() {
  const duplicateStudentId = '178df977-e6f8-4ed2-86c5-57a6d88aac99';
  const duplicateEnrollmentId = '02148ff1-7a2e-4e8d-9bb1-a10260bed941';

  console.log(`=== REMOVING DUPLICATE STUDENT RECORD [${duplicateStudentId}] ===`);

  // 1. Delete enrollment
  const { error: eErr } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', duplicateEnrollmentId);

  if (eErr) {
    console.error("Error deleting duplicate enrollment:", eErr);
  } else {
    console.log("✅ Duplicate enrollment deleted successfully.");
  }

  // 2. Delete student
  const { error: sErr } = await supabase
    .from('students')
    .delete()
    .eq('id', duplicateStudentId);

  if (sErr) {
    console.error("Error deleting duplicate student:", sErr);
  } else {
    console.log("✅ Duplicate student record deleted successfully.");
  }

  // Verify
  const { data: remaining } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))')
    .ilike('name', '%DAVI%SALMENTO%');

  console.log(`\nRemaining student records for Davi Carvalho Salmento: ${remaining?.length || 0}`);
  remaining?.forEach(s => {
    console.log(`- ID: ${s.id} | Name: ${s.name} | Reg: ${s.registration_number}`);
    s.enrollments?.forEach(e => {
      console.log(`   -> Enrollment ID: ${e.id} | Class: ${e.classrooms?.name} | Status: '${e.status}'`);
    });
  });
}

removeDuplicate();
