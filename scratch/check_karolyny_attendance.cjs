const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function check() {
  console.log('--- Buscando aluno ANY KAROLYNY ---');
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%KAROLYNY%');
  
  if (studentErr) {
    console.error('Erro ao buscar estudante:', studentErr);
    return;
  }
  
  console.log('Estudantes encontrados:', students);
  
  if (students && students.length > 0) {
    const student = students[0];
    const regNum = student.registration_number;
    const uuid = student.id;
    
    console.log(`\n--- Buscando presenças na tabela class_attendance_students ---`);
    console.log(`Com student_id = ${uuid} (UUID)...`);
    const { data: attUuid } = await supabase
      .from('class_attendance_students')
      .select('*, class_attendance_records(date, classroom_name, subject)')
      .eq('student_id', uuid);
    console.log(`Encontrados com UUID:`, attUuid?.length || 0);
    if (attUuid && attUuid.length > 0) {
      console.log('Amostra de registros por UUID:', attUuid.slice(0, 5));
    }
    
    console.log(`Com student_id = '${regNum}' (registration_number)...`);
    const { data: attReg } = await supabase
      .from('class_attendance_students')
      .select('*, class_attendance_records(date, classroom_name, subject)')
      .eq('student_id', regNum);
    console.log(`Encontrados com regNum:`, attReg?.length || 0);
    if (attReg && attReg.length > 0) {
      console.log('Amostra de registros por regNum:', attReg.slice(0, 5));
    }
    
    console.log(`Com student_name = "${student.name}"...`);
    const { data: attName } = await supabase
      .from('class_attendance_students')
      .select('*, class_attendance_records(date, classroom_name, subject)')
      .eq('student_name', student.name);
    console.log(`Encontrados com student_name:`, attName?.length || 0);
  }
}

check().catch(console.error);
