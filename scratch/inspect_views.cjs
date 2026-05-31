const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Buscando views existentes no banco ---');
  
  // PostgREST exposes all views in the anonymous schema. 
  // We can try to query them or check if there is an information schema endpoint or if we can query pg_catalog.
  // Actually, we can check by querying some common view names, or let's try to query a system table that is sometimes exposed.
  // Let's check common view names:
  const commonViews = [
    'student_attendance_summary',
    'student_attendance_stats',
    'attendance_summary',
    'attendance_stats',
    'student_frequency',
    'v_student_attendance',
    'student_attendance_view'
  ];
  
  for (const view of commonViews) {
    const { data, error } = await supabase.from(view).select('*').limit(1);
    if (!error) {
      console.log(`A view "${view}" EXISTE!`);
    } else {
      // If it says "relation does not exist", it doesn't exist
      if (!error.message.includes('does not exist')) {
        console.log(`A view "${view}" existe mas deu erro:`, error.message);
      }
    }
  }
}

check().catch(console.error);
