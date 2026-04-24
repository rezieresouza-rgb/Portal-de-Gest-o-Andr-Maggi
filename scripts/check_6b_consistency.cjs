const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkConsistency() {
  console.log("=== Checking 6º ANO B Consistency ===");
  
  // 1. Get all classrooms named 6º ANO B
  const { data: classrooms, error: classError } = await supabase
    .from('classrooms')
    .select('*')
    .eq('name', '6º ANO B');

  console.log("Classrooms found:", classrooms);

  if (classrooms.length === 0) return;

  const classroomIds = classrooms.map(c => c.id);

  // 2. Get all enrollments for these classrooms
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      status,
      classroom_id,
      students (
        id,
        name,
        registration_number
      )
    `)
    .in('classroom_id', classroomIds)
    .in('status', ['ATIVO', 'RECLASSIFICADO']);

  console.log(`Total Active Enrollments in 6º ANO B classrooms: ${enrollments.length}`);

  // 3. Compare with useStudents logic
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, name, registration_number, enrollments(status, classrooms(name), enrollment_date)');

  const mapped = allStudents.map(s => {
    const active = (s.enrollments || []).filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
    const sorted = active.sort((a, b) => new Date(b.enrollment_date || 0) - new Date(a.enrollment_date || 0));
    const latest = sorted[0];
    return {
      name: s.name,
      registration: s.registration_number,
      class: latest?.classrooms?.name || 'SEM TURMA'
    };
  });

  const in6B = mapped.filter(m => m.class === '6º ANO B');
  console.log(`Students mapped to 6º ANO B by hook logic: ${in6B.length}`);

  // Find the discrepancy
  const enrollmentNames = new Set(enrollments.map(e => e.students.name));
  const hookNames = new Set(in6B.map(m => m.name));

  const missingFromHook = Array.from(enrollmentNames).filter(name => !hookNames.has(name));
  const extraInHook = Array.from(hookNames).filter(name => !enrollmentNames.has(name));

  if (missingFromHook.length > 0) {
    console.log("Missing from hook (Enrolled in 6B but hook maps elsewhere):", missingFromHook);
    // Find where they are mapped
    missingFromHook.forEach(name => {
      const student = mapped.find(m => m.name === name);
      console.log(`  - ${name} is mapped to: ${student?.class}`);
    });
  }

  if (extraInHook.length > 0) {
    console.log("Extra in hook (Hook maps to 6B but not enrolled in 6B classrooms):", extraInHook);
  }
}

checkConsistency();
