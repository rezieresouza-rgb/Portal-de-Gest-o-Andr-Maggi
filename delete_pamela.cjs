const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const studentName = "YASMIN VITÓRIA DE AZEVEDO";
  
  console.log(`Searching for student: ${studentName}`);
  const { data: students, error: searchError } = await supabase
    .from('students')
    .select('id, name')
    .ilike('name', `%${studentName}%`);

  if (searchError) {
    console.error('Error searching student:', searchError);
    return;
  }

  if (!students || students.length === 0) {
    console.log('Student not found.');
    return;
  }

  for (const student of students) {
    console.log(`Removing student ${student.name} (ID: ${student.id})...`);
    
    // 1. Remove enrollments
    console.log("Removing enrollments...");
    const { error: enrollError } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', student.id);
      
    if (enrollError) {
        console.log("Error removing enrollment:", enrollError);
        continue;
    }
    
    // 2. Remove student record
    console.log("Removing student record...");
    const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

    if (studentError) {
        console.log("Error removing student:", studentError);
    } else {
        console.log(`Successfully removed ${student.name}.`);
    }
  }
}

run();
