const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local in root
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsData = [
  {"code": "250648", "name": "KAUAN EDUARDO BITENCOURT"},
  {"code": "260523", "name": "PEDRO HENRIQUE TREVIZAN DA SILVA"},
  {"code": "221358", "name": "PAMELA VITORIA RAMOS ANDRADE"},
  {"code": "256401", "name": "SARAH DOS SANTOS LIMA"},
  {"code": "260375", "name": "SARAH PEREIRA DE ALMEIDA"},
  {"code": "260338", "name": "SOPHIA PEREIRA DE ALMEIDA"},
  {"code": "264253", "name": "TAYNARA FIGUEIREDO VASCON"},
  {"code": "215538", "name": "VICTTOR HUGO MONTEIRO DE SOUZA"},
  {"code": "251735", "name": "DAVI LUCA BARBOZA MOREIRA"},
  {"code": "255160", "name": "DHAFINE LAVINYA GOMES FERREIRA"},
  {"code": "264322", "name": "EMANUELLY MORAES GOMES"},
  {"code": "222108", "name": "EMANUELLY VITORIA DIAS PRATES"},
  {"code": "222319", "name": "EMILLY VITORIA RODAS DE AMORIM"},
  {"code": "220546", "name": "ENDREW ALVES DE SOUZA"},
  {"code": "256048", "name": "ENZO DA COSTA LIMA"},
  {"code": "255513", "name": "ENZO JOSE DE SOUZA NICOLETTI"},
  {"code": "253709", "name": "ERYKSON KAIAM PEREIRA DA SILVA"},
  {"code": "255832", "name": "FABRICIO LEANDRO FLOR VERDADEIRO"},
  {"code": "256801", "off_code": "256801", "name": "FELIPE BONETTI MILHEIRO"},
  {"code": "250783", "name": "GABRIEL HENRIQUE DUARTE"},
  {"code": "256882", "name": "GEOVANA KETTELLEEN NASCIMENTO DA COSTA"},
  {"code": "251786", "name": "GUSTAVO AMORIM DOS SANTOS"},
  {"code": "255330", "name": "GUSTAVO SILVA FLOR"},
  {"code": "223294", "name": "HELOISE PEDROTTI RAMOS"},
  {"code": "240307", "name": "ISABELA SOARES DO BEM"},
  {"code": "220014", "name": "JOÃO GABRIEL DA SILVA"},
  {"code": "255801", "name": "JOÃO LUCAS DO NASCIMENTO LIMA"},
  {"code": "224547", "name": "JULLIA RAFAELA GOMES DA CRUZ"},
  {"code": "256018", "name": "NAYANI FERNANDES DA SILVA"},
  {"code": "259602", "name": "LORRAYNE SOUZA JACINTO"}
];

async function update7A() {
  console.log("Starting update for 7º Ano A...");

  const className = '7º ANO A';
  const year = '2026';

  // 1. Ensure Classroom exists
  let { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', className)
    .eq('year', year)
    .single();

  if (!classroom) {
    console.log(`${className} not found, creating...`);
    const { data: newRoom, error: createRErr } = await supabase
      .from('classrooms')
      .insert({
        name: className,
        year: year,
        shift: 'MATUTINO'
      })
      .select()
      .single();
    
    if (createRErr) throw createRErr;
    classroom = newRoom;
  }

  const classroomId = classroom.id;
  console.log(`Classroom ID: ${classroomId}`);

  // 2. Get current enrollments to see who to remove (optional but clean)
  // For safety, we'll just delete all and re-insert to match the PDF perfectly.
  console.log("Clearing existing enrollments for this class...");
  const { error: delErr } = await supabase
    .from('enrollments')
    .delete()
    .eq('classroom_id', classroomId);
  
  if (delErr) console.error("Error clearing enrollments:", delErr);

  // 3. Process Students
  console.log(`Processing ${studentsData.length} students...`);
  for (const s of studentsData) {
    // Check if student exists by registration_number
    let { data: student, error: sErr } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', s.code)
      .maybeSingle();

    let studentId;
    if (!student) {
      console.log(`Creating student: ${s.name} (${s.code})...`);
      const { data: newStudent, error: createSErr } = await supabase
        .from('students')
        .insert({
          name: s.name,
          registration_number: s.code,
          birth_date: '2013-01-01', // Default for 7th grade (~12-13 years old)
          status: 'ATIVO'
        })
        .select()
        .single();
      
      if (createSErr) {
        console.error(`Error creating ${s.name}:`, createSErr);
        continue;
      }
      studentId = newStudent.id;
    } else {
      studentId = student.id;
      // Update name to match official list exactly
      await supabase.from('students').update({ name: s.name }).eq('id', studentId);
    }

    // 4. Enroll Student
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        classroom_id: classroomId,
        enrollment_date: '2026-02-10'
      });

    if (enrollErr) {
      console.error(`Error enrolling ${s.name}:`, enrollErr);
    }
  }

  console.log("Update complete! Verifying total...");
  const { count, error: countErr } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroomId);

  if (countErr) console.error("Error verifying count:", countErr);
  else console.log(`Total students enrolled in ${className}: ${count}`);
}

update7A().catch(err => console.error("FATAL ERROR:", err));
