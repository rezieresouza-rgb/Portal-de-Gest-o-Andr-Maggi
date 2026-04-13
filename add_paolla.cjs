const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const studentsToAdd = [
    { name: "SAMELA VITORIA RAMOS ANDRADE", registration: "2213860" }
  ];
  const className = "7º ANO A";

  console.log(`Starting bulk process for ${className}...`);

  // 1. Find Classroom
  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', className)
    .single();

  if (classroomError || !classroom) {
    console.error(`Classroom ${className} not found:`, classroomError);
    return;
  }
  const classroomId = classroom.id;
  console.log(`Classroom ID: ${classroomId}`);

  for (const s of studentsToAdd) {
    console.log(`Processing student: ${s.name} (${s.registration})`);
    
    // 2. Check if Student exists
    let { data: student, error: studentSearchError } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', s.registration)
      .single();

    let studentId;
    if (!student) {
      console.log(`Student not found by registration. Checking by name...`);
      const { data: studentByName } = await supabase
        .from('students')
        .select('id')
        .ilike('name', s.name)
        .single();
      
      if (studentByName) {
          studentId = studentByName.id;
          console.log(`Student found by name: ${studentId}. Updating registration...`);
          await supabase.from('students').update({ registration_number: s.registration }).eq('id', studentId);
      } else {
          console.log(`Creating student...`);
          const { data: newStudent, error: createError } = await supabase
            .from('students')
            .insert({
              name: s.name.toUpperCase(),
              registration_number: s.registration,
              status: 'ATIVO',
              birth_date: '2014-01-01'
            })
            .select()
            .single();
          
          if (createError) {
            console.error(`Error creating student ${s.name}:`, createError);
            continue;
          }
          studentId = newStudent.id;
      }
    } else {
      studentId = student.id;
      console.log(`Student exists with ID: ${studentId}`);
    }

    // 3. Enroll Student
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .single();

    if (!existingEnrollment) {
      console.log(`Enrolling student...`);
      const { error: enrollErr } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          classroom_id: classroomId,
          enrollment_date: new Date().toISOString().split('T')[0]
        });

      if (enrollErr) {
        console.error(`Error enrolling ${s.name}:`, enrollErr);
      } else {
        console.log(`Student ${s.name} successfully enrolled in ${className}.`);
      }
    } else {
      console.log(`Student ${s.name} is already enrolled in ${className}.`);
    }
  }
}

run();
