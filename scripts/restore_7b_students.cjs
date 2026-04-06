const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsData = [
  {"code": "220790", "name": "MURILO SEICENTOS DE LIMA"},
  {"code": "250317", "name": "MYCILLENE APARECIDA DOS SANTOS"},
  {"code": "258160", "name": "PEDRO HENRIQUE REBOUÇAS SALGO"},
  {"code": "224358", "name": "TAKAKAJYRY METUKTIRE"},
  {"code": "254800", "name": "THIAGO GOMES FERREIRA"},
  {"code": "221022", "name": "VITOR DANIEL ARQUINO BATISTA"},
  {"code": "250648", "name": "YASMIN VITÓRIA DE AZEVEDO"},
  {"code": "220835", "name": "AMANDA ESTEFANY SIQUEIRA DA SILVA"},
  {"code": "252315", "name": "ANA BEATRIZ PEREIRA MENDES DOS SANTOS"},
  {"code": "250322", "name": "ANNA LAURA SILVA RIBEIRO"},
  {"code": "259465", "name": "BRENDO HENRIQUE DE OLIVEIRA NOVAIS"},
  {"code": "214960", "name": "CLEICIANE SOARES RODRIGUES"},
  {"code": "260092", "name": "FELIP APARECIDO BELARMINO"},
  {"code": "259478", "name": "ISABELLY PEREIRA DE SOUZA"},
  {"code": "221418", "name": "JOÃO PEDRO SABOIA RAMOS"},
  {"code": "259497", "name": "JOÃO VITOR RAMOS DALBERTO"},
  {"code": "254514", "name": "JOHNNY SOUZA ALMEIDA"},
  {"code": "240526", "name": "KAIQUE JOSE CANDIDO DA SILVA"},
  {"code": "233847", "name": "KAYLA RAFAELA LAGE HORNICH"},
  {"code": "241754", "name": "KETHELYN SOFIA DE SOUSA DOS SANTOS"},
  {"code": "224017", "name": "KOKONA TXUKARRAMAE"},
  {"code": "258160_2", "name": "LUIZ FELIPE BRAIDA", "original_code": "258160"},
  {"code": "224825", "name": "LUKAS GONÇALVES DOMINGOS"},
  {"code": "234885", "name": "MARIA LARA DAL PUFO DE CARVALHO"},
  {"code": "259745", "name": "MARIA VITÓRIA DA SILVA SOUZA"},
  {"code": "220789", "name": "MIGUEL SEICENTOS DE LIMA"},
  {"code": "260095", "name": "MIKAELLY SANTOS AZEVEDO"},
  {"code": "255231", "name": "YASMIN VITORIA DO NASCIMENTO FIGUEIREDO"},
  {"code": "260046", "name": "HEVILLY GARCIA JARDIM"}
];

async function restore7B() {
  console.log("Restoring 7º Ano B (2026)...");

  const className = '7º ANO B';
  const year = '2026';

  // 1. Create Classroom
  const { data: classroom, error: cErr } = await supabase
    .from('classrooms')
    .insert({
      name: className,
      year: year,
      shift: 'VESPERTINO'
    })
    .select()
    .single();
  
  if (cErr) {
    console.error("Error creating classroom:", cErr.message);
    return;
  }

  const classroomId = classroom.id;
  console.log(`Classroom restored: ${classroomId}`);

  // 2. Process Students
  console.log(`Processing ${studentsData.length} students...`);
  for (const s of studentsData) {
    const regNum = s.original_code || s.code;
    
    // Check if student exists
    let { data: student, error: sErr } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', regNum)
      .maybeSingle();

    let studentId;
    if (!student) {
      console.log(`Creating student: ${s.name} (${regNum})...`);
      const { data: newStudent, error: createSErr } = await supabase
        .from('students')
        .insert({
          name: s.name,
          registration_number: regNum,
          birth_date: '2013-01-01',
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
      // Update name to match official list
      await supabase.from('students').update({ name: s.name }).eq('id', studentId);
    }

    // 3. Enroll Student
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

  console.log("Restoration complete!");
  const { count, error: countErr } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroomId);

  if (countErr) console.error("Error verifying count:", countErr);
  else console.log(`Total students enrolled in ${className} (Restored): ${count}`);
}

restore7B().catch(err => console.error("FATAL ERROR:", err));
