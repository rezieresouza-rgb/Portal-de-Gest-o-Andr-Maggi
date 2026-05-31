const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  // 1. Fetch student
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%ANY KAROLYNY%');
    
  const s = students[0];
  console.log('Estudante:', s);

  // 2. Fetch first 1000 attendance records (like current implementation)
  const { data: attendanceData } = await supabase
    .from('class_attendance_students')
    .select('student_id, is_present');
    
  const attendanceStats = {};
  attendanceData.forEach(record => {
    const sid = record.student_id;
    if (!attendanceStats[sid]) attendanceStats[sid] = { total: 0, present: 0 };
    attendanceStats[sid].total++;
    if (record.is_present) attendanceStats[sid].present++;
  });
  
  // 3. Look up stats for Any Karolyny
  console.log('\n--- Simulação de Busca de Stats ---');
  console.log(`stats por registration_number (${s.registration_number}):`, attendanceStats[s.registration_number]);
  console.log(`stats por id (${s.id}):`, attendanceStats[s.id]);
  
  const stats = attendanceStats[s.registration_number] || attendanceStats[s.id] || { total: 0, present: 0 };
  const totalDays = stats.total;
  const presentDays = stats.present;
  const attendancePercent = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;
  
  console.log(`totalDays: ${totalDays}, presentDays: ${presentDays}`);
  console.log(`attendancePercent calculado: ${attendancePercent}%`);
}

check().catch(console.error);
