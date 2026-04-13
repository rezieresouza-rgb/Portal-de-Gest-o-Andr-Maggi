const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomName = '6º ANO A';

async function updateEnrollmentDates() {
  console.log(`Starting enrollment date update for ${classroomName}...`);

  // 1. Get classroom ID
  const { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', classroomName)
    .single();

  if (cErr || !classroom) {
    console.error(`Error: Classroom ${classroomName} not found.`);
    return;
  }

  const classroomId = classroom.id;

  // 2. Define the students with their specific dates
  // FELIPE NUNES DA SILVA (2723256) -> 2026-02-02
  // All others -> 2026-01-19

  // Get all students enrolled in this class
  const { data: enrolls, error: eErr } = await supabase
    .from('enrollments')
    .select('id, student_id, students(name, registration_number)')
    .eq('classroom_id', classroomId);

  if (eErr) {
    console.error("Error fetching enrollments:", eErr.message);
    return;
  }

  console.log(`Found ${enrolls.length} students enrolled in ${classroomName}.`);

  let updatedCount = 0;

  for (const e of enrolls) {
    const studentName = e.students.name;
    const registration = e.students.registration_number;
    let newDate = '2026-01-19'; // Default for most

    if (registration === '2723256' || studentName.includes('FELIPE NUNES DA SILVA')) {
      newDate = '2026-02-02';
    }

    const { error: updateErr } = await supabase
      .from('enrollments')
      .update({ enrollment_date: newDate })
      .eq('id', e.id);

    if (updateErr) {
      console.error(`Error updating enrollment for ${studentName}:`, updateErr.message);
    } else {
      console.log(`Updated enrollment date for ${studentName} to ${newDate}`);
      updatedCount++;
    }
  }

  console.log(`Total enrollment dates updated: ${updatedCount}`);
}

updateEnrollmentDates();
