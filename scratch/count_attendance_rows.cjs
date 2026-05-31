const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Contando registros em class_attendance_students ---');
  
  // 1. Get exact total count from db
  const { count, error: countErr } = await supabase
    .from('class_attendance_students')
    .select('*', { count: 'exact', head: true });
    
  if (countErr) {
    console.error('Erro na contagem:', countErr);
    return;
  }
  console.log('Contagem total exata de linhas:', count);
  
  // 2. See how many rows a standard select returns
  const { data: records, error: selectErr } = await supabase
    .from('class_attendance_students')
    .select('student_id, is_present');
    
  if (selectErr) {
    console.error('Erro no select:', selectErr);
    return;
  }
  console.log('Linhas retornadas pelo select sem limites:', records.length);
}

check().catch(console.error);
