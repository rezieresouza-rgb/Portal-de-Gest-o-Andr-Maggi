const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteGabriel() {
  const studentName = 'GABRIEL HENRIKE DUARTE';
  const studentCode = '2596783';
  const studentId = '7dacfb68-66d7-4dfb-9334-acc55aa4a4c8';

  console.log(`Starting cleanup for ${studentName}...`);

  // 1. Check history
  const { data: grades } = await supabase.from('grades').select('id').eq('student_code', studentCode);
  const { data: occs } = await supabase.from('occurrences').select('id').eq('student_name', studentName);

  if ((grades && grades.length > 0) || (occs && occs.length > 0)) {
      console.log(`Student has history (Grades: ${grades?.length}, Occurrences: ${occs?.length}). Inactivating instead of deleting.`);
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'TRANSFERIDO' })
        .eq('student_id', studentId);
      
      if (error) console.error("Error inactivating:", error);
      else console.log("Enrollment status updated to TRANSFERIDO.");
  } else {
      console.log("No history found. Deleting enrollment and student record.");
      
      // Delete enrollment first
      const { error: enrErr } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', studentId);
      
      if (enrErr) console.error("Error deleting enrollment:", enrErr);
      else {
          console.log("Enrollment deleted.");
          // Delete student
          const { error: stdErr } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
          
          if (stdErr) console.error("Error deleting student:", stdErr);
          else console.log("Student record deleted successfully.");
      }
  }
}

deleteGabriel();
