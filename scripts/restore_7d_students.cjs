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
  {"code": "258015", "name": "ANA HELOISA DO NASCIMENTO"},
  {"code": "213706", "name": "ANA VITORIA DOS SANTOS MATEUS"},
  {"code": "260127", "name": "ANDRIELY CAMARA DE SOUZA"},
  {"code": "217682", "name": "BEKWYPRYTO METUKTIRE TXUCARRAMAE"},
  {"code": "248677", "name": "BRENDA VITÓRIA DOS SANTOS BESERRA"},
  {"code": "230885", "name": "BRUNO VICTOR PEREIRA DA SILVA"},
  {"code": "219165", "name": "CARLOS EDUARDO ALVES CIRILO"},
  {"code": "258931", "name": "DAVI LUCAS ARANHA DA SILVA"},
  {"code": "220834", "name": "EDUARDA CARVALHO COSTA"},
  {"code": "261426", "name": "ERICK HONORATO FAGUNDES DE OLIVEIRA"},
  {"code": "260146", "name": "ESTER MARTINS DA SILVA"},
  {"code": "197432", "name": "IREKARE METUKTIRE"},
  {"code": "260159", "name": "ISAAC BALDUINO DA COSTA"},
  {"code": "258061", "name": "ISABELLY GONÇALVES ALVES"},
  {"code": "259966", "name": "ISADORA SANTOS CAVALCANTE"},
  {"code": "259781", "name": "IZADORA FERREIRA DOS SANTOS"},
  {"code": "220834_2", "name": "JORGE HENRIQUE DOS SANTOS DA COSTA", "original_code": "220834"},
  {"code": "259550", "name": "JULLYANA ALONSO ARAUJO"},
  {"code": "224454", "name": "KARINE VICTORIA OLIVEIRA CÂNDIDO"},
  {"code": "259730", "name": "KAYKY RAFAEL DORINI DO PRADO"},
  {"code": "224648", "name": "KEMILY KAUANY OLIVEIRA DOS SANTOS"},
  {"code": "220856", "name": "KENYA KATTIELY DA SILVA SANTOS"},
  {"code": "223939", "name": "KOKOYAPOJTI METUKTIRE"},
  {"code": "213720", "name": "KRYSTHOFFER GABRIEL MARTINS BORGES"},
  {"code": "259928", "name": "LUIZ FRANCISCO ROBERT ABREU"},
  {"code": "214230", "name": "PEDRO GABRIEL SANTOS DA SILVA"},
  {"code": "220788", "name": "TALITA SANTIAGO DE OLIVEIRA BENTO"},
  {"code": "258146", "name": "YURI RAFAEL DOS SANTOS OLIVEIRA"},
  {"code": "204836", "name": "CLAUDEMIR ADRIAM CALIXTO BIFI"},
  {"code": "272236", "name": "MARIA ELOIZA CAETANO NASCIMENTO"}
];

async function restore7D() {
  const className = '7º ANO D';
  const year = '2026';

  console.log(`Restoring ${className}...`);

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
    let { data: student } = await supabase
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
        console.error(`Error creating ${s.name}:`, createSErr.message);
        continue;
      }
      studentId = newStudent.id;
    } else {
      studentId = student.id;
    }

    // 3. Enroll
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        classroom_id: classroomId,
        enrollment_date: '2026-02-10'
      });
    
    if (enrollErr) {
       console.error(`Error enrolling ${s.name}:`, enrollErr.message);
    } else {
       console.log(`Enrolled: ${s.name}`);
    }
  }

  console.log("\nRestoration of 7º ANO D Complete.");
}

restore7D();
