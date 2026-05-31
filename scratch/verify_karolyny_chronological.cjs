const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Analisando presenças de ANY KAROLYNY ---');
  const { data, error } = await supabase
    .from('class_attendance_students')
    .select('*, class_attendance_records(date, subject)')
    .eq('student_id', '2244517');
    
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('Total de registros:', data.length);
  
  const sorted = data.sort((a, b) => new Date(a.class_attendance_records.date).getTime() - new Date(b.class_attendance_records.date).getTime());
  
  console.log('Primeiros 10 registros (cronológicos):');
  sorted.slice(0, 10).forEach(r => {
    console.log(`  Data: ${r.class_attendance_records.date} | Aula: ${r.class_attendance_records.subject} | Presença: ${r.is_present}`);
  });
  
  const total = data.length;
  const present = data.filter(r => r.is_present).length;
  console.log(`\nResumo total: ${present} presentes de ${total} totais (${((present/total)*100).toFixed(2)}%)`);
}

check().catch(console.error);
