const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Analisando datas de class_attendance_records ---');
  
  // 1. Get minimum and maximum dates
  const { data: minDate } = await supabase
    .from('class_attendance_records')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);
    
  const { data: maxDate } = await supabase
    .from('class_attendance_records')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);
    
  console.log('Data mínima:', minDate?.[0]?.date);
  console.log('Data máxima:', maxDate?.[0]?.date);

  // 2. Count records from the last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const dateStr = thirtyDaysAgo.toLocaleDateString('sv-SE');
  
  const { count, error } = await supabase
    .from('class_attendance_students')
    .select('*, class_attendance_records!inner(date)', { count: 'exact', head: true })
    .gte('class_attendance_records.date', dateStr);
    
  console.log(`Registros nos últimos 30 dias (desde ${dateStr}):`, count);
}

check().catch(console.error);
