const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const className = '7º ANO E';
const year = '7º';
const shift = 'VESPERTINO';

const studentsList = [
  { registration: "2506998", name: "ANGELO FERREIRA CORBALAN", gender: "M", birth: "2013-07-04" },
  { registration: "2244517", name: "ANY KAROLYNY GONÇALVES ROCHA", gender: "F", birth: "2013-11-11" },
  { registration: "2208346", name: "BEATHRIZ RIBEIRO DE SOUZA", gender: "F", birth: "2013-03-31" },
  { registration: "2156344", name: "GUSTAVO HENRIQUE CRUZ DA SILVA", gender: "M", birth: "2012-07-04" },
  { registration: "2420336", name: "IREBIERE METUKTIRE", gender: "F", birth: "2013-06-15" },
  { registration: "2208354", name: "ISADORA ZANOVELLO DA SILVA", gender: "F", birth: "2013-08-17" },
  { registration: "2213985", name: "KETHELLY YASMIN ALVES BISPO", gender: "F", birth: "2013-12-03" },
  { registration: "2228554", name: "KOKOYAMROTI METUKTIRE TAPAYUNA", gender: "F", birth: "2013-06-25" },
  { registration: "2604773", name: "LAURA IASMIN CAMPOS SILVA", gender: "F", birth: "2014-03-20" },
  { registration: "2623763", name: "LAYLA LORELLAY DE OLIVEIRA SILVA", gender: "F", birth: "2012-12-18" },
  { registration: "2613255", name: "LEIDIANE VILLA RIEDEL", gender: "F", birth: "2013-07-23" },
  { registration: "2601238", name: "LUIZ OTÁVIO NEDERMEYER", gender: "M", birth: "2012-08-21" },
  { registration: "2246483", name: "MARIA EDUARDA GONSALVES RIBEIRO", gender: "F", birth: "2013-06-12" },
  { registration: "2413159", name: "MAYK NATANAEL MAY DA SILVA", gender: "M", birth: "2013-12-27" },
  { registration: "2601671", name: "NHAKNHYRY TXUCARRAMÃE", gender: "F", birth: "2013-12-06" },
  { registration: "2352757", name: "PEDRO LUCCA GOMES DA SILVA", gender: "M", birth: "2013-11-10" },
  { registration: "2209137", name: "PEDRO RAFAEL AMÂNCIO DE LIMA", gender: "M", birth: "2013-01-05" },
  { registration: "2601426", name: "RAISSA MARTINS SANTOS", gender: "F", birth: "2013-11-14" },
  { registration: "2370567", name: "SAMELLA FLORES FIRMINO", gender: "F", birth: "2012-07-08" },
  { registration: "2418734", name: "SARA MAYARA DE OLIVEIRA MEDEIROS", gender: "F", birth: "2012-10-13" },
  { registration: "2537653", name: "TAKAK JAMRO METUKTIRE", gender: "F", birth: "2011-05-12" },
  { registration: "2600477", name: "TEPYIN YANARI METUKTIRE", gender: "M", birth: "2013-05-03" },
  { registration: "2604711", name: "THAWANY FERNANDA DE JESUS CORDEIRO", gender: "F", birth: "2013-10-17" },
  { registration: "2623137", name: "TIAGO DOMINGUES DOS SANTOS", gender: "M", birth: "2013-09-16" },
  { registration: "2208483", name: "VITOR GABRIEL LIMA SILVA", gender: "M", birth: "2013-05-05" },
  { registration: "2258234", name: "VITÓRIA BORGES CARDOSO", gender: "F", birth: "2013-04-27" },
  { registration: "2207809", name: "WELLITON DA SILVA LOZANO", gender: "M", birth: "2013-07-19" },
  { registration: "2722312", name: "JOÃO PEDRO SOUZA CAETANO PEREIRA", gender: "M", birth: "2012-01-30" },
  { registration: "2651278", name: "MATHEUS RAMOS SOARES", gender: "M", birth: "2014-05-08" }
];

async function setupClassroom() {
  console.log(`Setting up classroom: ${className}`);

  // Create classroom if it doesn't exist
  let { data: classrooms, error: fetchErr } = await supabase
    .from('classrooms')
    .select('id, name')
    .ilike('name', className);

  let classroomId;

  if (classrooms && classrooms.length > 0) {
    classroomId = classrooms[0].id;
    console.log(`Classroom already exists with ID: ${classroomId}`);
  } else {
    console.log('Classroom not found. Creating...');
    const { data: newClassroom, error: insertErr } = await supabase
      .from('classrooms')
      .insert({
        name: className,
        year: year,
        shift: shift,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Error creating classroom:', insertErr);
      return;
    }
    classroomId = newClassroom.id;
    console.log(`Classroom created with ID: ${classroomId}`);
  }

  console.log(`\nProcessing ${studentsList.length} students...`);

  for (const s of studentsList) {
    // Check if student exists
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', s.registration);

    let studentId;

    if (existingStudents && existingStudents.length > 0) {
      studentId = existingStudents[0].id;
      // Update student details if necessary
      await supabase
        .from('students')
        .update({
          name: s.name,
          gender: s.gender,
          birth_date: s.birth,
        })
        .eq('id', studentId);
      console.log(`Updated existing student: ${s.name} (${s.registration})`);
    } else {
      // Look up by name just in case registration changed
      const { data: existingByName } = await supabase
        .from('students')
        .select('id')
        .ilike('name', s.name);
        
      if (existingByName && existingByName.length > 0) {
         studentId = existingByName[0].id;
         await supabase
          .from('students')
          .update({
            registration_number: s.registration,
            gender: s.gender,
            birth_date: s.birth,
          })
          .eq('id', studentId);
         console.log(`Updated existing student by name: ${s.name} (${s.registration})`);
      } else {
          // Insert new student
          const { data: insertedStudent, error: insertStudentErr } = await supabase
            .from('students')
            .insert({
              registration_number: s.registration,
              name: s.name,
              gender: s.gender,
              birth_date: s.birth,
              status: 'ATIVO'
            })
            .select('id')
            .single();

          if (insertStudentErr) {
            console.error(`Error inserting student ${s.name}:`, insertStudentErr);
            continue;
          }
          studentId = insertedStudent.id;
          console.log(`Inserted new student: ${s.name} (${s.registration})`);
      }
    }

    // Enroll student
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, classroom_id')
      .eq('student_id', studentId)
      .is('end_date', null)
      .maybeSingle();

    if (existingEnrollment) {
      if (existingEnrollment.classroom_id !== classroomId) {
        await supabase
          .from('enrollments')
          .update({ classroom_id: classroomId, enrollment_date: '2026-01-20' })
          .eq('id', existingEnrollment.id);
        console.log(`  -> Moved to ${className}`);
      } else {
        console.log(`  -> Already in ${className}`);
      }
    } else {
      await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          classroom_id: classroomId,
          enrollment_date: '2026-01-20',
          status: 'ATIVO'
        });
      console.log(`  -> Enrolled in ${className}`);
    }
  }

  console.log('\nAll done!');
}

setupClassroom();
