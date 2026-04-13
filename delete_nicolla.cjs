const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const studentId = 'e6c54bcf-4006-4877-ba9f-bb7484fb7a60';
  
  console.log("Removing enrollment...");
  const { error: enrollError } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId);
    
  if (enrollError) {
      console.log("Error removing enrollment:", enrollError);
      return;
  }
  
  console.log("Removing student record...");
  const { error: studentError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

  if (studentError) {
      console.log("Error removing student:", studentError);
  } else {
      console.log("Successfully removed NICOLLA LINDCIA ZILVA.");
  }
}

run();
