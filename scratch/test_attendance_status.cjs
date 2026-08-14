const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAttendanceStatus() {
  console.log("=== TESTANDO BUSCA DE STATUS DE ALUNOS PARA O HISTÓRICO DE CHAMADA ===");

  const { data: attendanceData } = await supabase
    .from('class_attendance_records')
    .select(`
       id,
       classroom_name,
       teacher_name,
       subject,
       date,
       shift,
       class_attendance_students (
         student_id,
         student_name,
         is_present
       )
    `)
    .limit(3);

  const { data: dbStudents } = await supabase
    .from('students')
    .select('id, name, registration_number, enrollments(status, classrooms(name))');

  const studentStatusMap = {};
  dbStudents?.forEach(s => {
    // Find latest active enrollment or specific enrollment status
    const activeEnr = 
      s.enrollments?.find(e => e.status === 'ATIVO') ||
      s.enrollments?.find(e => e.status === 'RECLASSIFICADO') ||
      s.enrollments?.find(e => e.status === 'MATRICULADO' || e.status === 'CURSANDO') ||
      s.enrollments?.[0];

    const statusVal = activeEnr?.status || 'ATIVO';
    const currentClass = activeEnr?.classrooms?.name;

    studentStatusMap[s.id] = { status: statusVal, currentClass };
    if (s.name) studentStatusMap[s.name.toUpperCase().trim()] = { status: statusVal, currentClass };
  });

  attendanceData?.forEach(rec => {
    console.log(`\nChamada: ${rec.subject} | Turma: ${rec.classroom_name} | Data: ${rec.date}`);
    rec.class_attendance_students.forEach(st => {
      const match = studentStatusMap[st.student_id] || studentStatusMap[st.student_name.toUpperCase().trim()];
      const status = match?.status || 'ATIVO';
      const currentClass = match?.currentClass;

      let isSpecialStatus = status !== 'ATIVO';
      console.log(` - Aluno: ${st.student_name.padEnd(35)} | Status: [${status}] ${isSpecialStatus ? `(Turma Atual: ${currentClass})` : ''}`);
    });
  });
}

testAttendanceStatus();
