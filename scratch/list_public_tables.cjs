const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Consultando tabelas/views do catálogo ---');
  
  // We can check if there are any tables we can access by trying to select from them.
  // We know of: students, classrooms, enrollments, class_attendance_records, class_attendance_students,
  // referrals, occurrences, mediation_cases, psychosocial_referrals, psychosocial_notifications,
  // active_search_actions, library_books, library_loans, library_readers.
  
  // Let's check if we can query pg_class or similar:
  const { data, error } = await supabase
    .from('pg_class')
    .select('relname')
    .limit(5);
    
  if (error) {
    console.log('pg_class não acessível:', error.message);
  } else {
    console.log('pg_class acessível! Tabelas/Views:', data);
  }
}

check().catch(console.error);
