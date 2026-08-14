const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const studentId = '05a5eddc-e96f-4a2e-9336-dbb9d1cfcac9'; // ISABELLY SILVA DE OLIVEIRA
  console.log("Checking student ISABELLY SILVA DE OLIVEIRA in all related tables...");

  // Check enrollments / turmas
  const { data: enrollments } = await supabase.from('enrollments').select('*').eq('student_id', studentId);
  console.log("Enrollments:", enrollments);

  // Check occurrences
  const { data: occs } = await supabase.from('occurrences').select('*').eq('student_id', studentId);
  console.log("Occurrences:", occs);

  // Check student_states (cívico-militar)
  const { data: states } = await supabase.from('student_states').select('*').eq('student_id', studentId);
  console.log("Student States:", states);

  // Perform deletion across tables
  console.log("\nDeleting student records...");
  
  if (enrollments && enrollments.length > 0) {
    const { error: eErr } = await supabase.from('enrollments').delete().eq('student_id', studentId);
    console.log("Deleted enrollments:", eErr || "Success");
  }

  if (states && states.length > 0) {
    const { error: stErr } = await supabase.from('student_states').delete().eq('student_id', studentId);
    console.log("Deleted student_states:", stErr || "Success");
  }

  // Delete from students table
  const { error: delErr } = await supabase.from('students').delete().eq('id', studentId);
  console.log("Deleted from students table:", delErr || "Success");
}

run();
