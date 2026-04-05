const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsData = [
  {"code": "2667230", "name": "YURY LUIS DOS SANTOS MOTA"},
  {"code": "2667754", "name": "MICHEL AZEVEDO PEREIRA"},
  {"code": "2667259", "name": "MIGUEL AZEVEDO PEREIRA"},
  {"code": "2667474", "name": "KAUAN FEITOSA MORAES"},
  {"code": "2667419", "name": "JOAO LUCAS DE SOUZA DA SILVA"},
  {"code": "2667373", "name": "DAVI LUCAS LIMA RODRIGUES"},
  {"code": "2667838", "name": "WILBER LERRANDRO LOPES APARECIDO"},
  {"code": "2667315", "name": "LEONEL FELIPE OLIVEIRA DOS SANTOS"},
  {"code": "2667352", "name": "MARIA FERNANDA EQUIDONE MACHADO"},
  {"code": "2663227", "name": "CRISLAINE EDUARDA FARIAS DE ALMEIDA"},
  {"code": "2666069", "name": "CRISLAINE VICTORIA FARIAS DE ALMEIDA"},
  {"code": "2663366", "name": "ANA CLARA PEREIRA BRITO"},
  {"code": "2663372", "name": "BEPIET PANARA METUKTIRE"},
  {"code": "2663302", "name": "ENZO ARTHUR DA SILVA SANTOS"},
  {"code": "2663331", "name": "EMILY CRISTINA DO NASCIMENTO"},
  {"code": "2663303", "name": "SABRINA VITORIA MATIAS MARTINS"},
  {"code": "2663337", "name": "JOAO GABRIEL DE OLIVEIRA MARTINS"},
  {"code": "2663319", "name": "ISADORA CAETANO MATEUS"},
  {"code": "2670313", "name": "MISAEL LUIZ DA SILVA DIAS"},
  {"code": "2226454", "name": "JOAO VITOR PEREIRA DA SILVA"},
  {"code": "2235438", "name": "GUSTAVO HENRIQUE DE PAULA DE LARA"},
  {"code": "2232207", "name": "JOAO OTAVIO GONSALVES DE LIMA"},
  {"code": "2302934", "name": "GUILHERME SOUZA ALVES"},
  {"code": "2237215", "name": "PAULA FERNANDA COIMBRA DA SILVA"},
  {"code": "2325664", "name": "MIKAELY TIBURCIO SILVA"},
  {"code": "2304139", "name": "JASMIM RAFAELA AMANCIO DE LIMA"},
  {"code": "2333256", "name": "FELIPE NUNES DA SILVA"},
  {"code": "2337289", "name": "FERNANDO DIARA TXUCARRAMAE"},
  {"code": "2347759", "name": "EMILLY VITORIA GOMES DOS SANTOS"},
  {"code": "2725402", "name": "DAVI CARVALHO SALMENTO"}
];

async function update6A() {
  console.log("Starting update for 6º Ano A...");

  // 1. Ensure Classroom exists
  let { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .select('id')
    .eq('name', '6º ANO A')
    .eq('year', '2026')
    .single();

  if (!classroom) {
    console.log("Classroom 6º Ano A not found, creating...");
    const { data: newRoom, error: createRErr } = await supabase
      .from('classrooms')
      .insert({
        name: '6º ANO A',
        year: '2026',
        shift: 'MATUTINO'
      })
      .select()
      .single();
    
    if (createRErr) throw createRErr;
    classroom = newRoom;
  }

  const classroomId = classroom.id;
  console.log(`Classroom ID: ${classroomId}`);

  // 2. Clear existing enrollments for this class (to replace with new official list)
  const { error: delErr } = await supabase
    .from('enrollments')
    .delete()
    .eq('classroom_id', classroomId);
  
  if (delErr) console.error("Error clearing enrollments:", delErr);

  // 3. Process Students
  for (const s of studentsData) {
    // Check if student exists
    let { data: student, error: sErr } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', s.code)
      .single();

    let studentId;
    if (!student) {
      console.log(`Creating student: ${s.name} (${s.code})...`);
      const { data: newStudent, error: createSErr } = await supabase
        .from('students')
        .insert({
          name: s.name,
          registration_number: s.code,
          birth_date: '2014-01-01',
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
      // Update name just in case
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

  console.log("Update complete!");
}

update6A();
