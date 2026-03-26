
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const CLASSROOM_ID = '51adb22f-63ae-4fa8-bcff-1875d9e5ae6d'; // 8º ANO B

const studentsData = [
  {"registration_number": "2235168", "name": "ALEX EMANUEL PAIXÃO SILVA", "status": "TRANSFERIDO DA ESCOLA"},
  {"registration_number": "2270899", "name": "ANA CLARA FIEL BRITO", "status": "MATRICULADO"},
  {"registration_number": "2165814", "name": "DERICK ENRIQUE GUIMARÃES AUGUSTO", "status": "MATRICULADO"},
  {"registration_number": "2197774", "name": "EMANOEL DUARTE VIANA", "status": "MATRICULADO"},
  {"registration_number": "2559835", "name": "FABIELLI VITÓRIA GONÇALVES COTTEVIQUE", "status": "MATRICULADO"},
  {"registration_number": "1977800", "name": "FELIPE PEREIRA VIEIRA", "status": "MATRICULADO"},
  {"registration_number": "2384196", "name": "FERNANDA LOPES PEREIRA", "status": "MATRICULADO"},
  {"registration_number": "2135818", "name": "IZAQUE SOARES CARON", "status": "MATRICULADO"},
  {"registration_number": "2151648", "name": "KAMILI DA SILVA SOUZA", "status": "MATRICULADO"},
  {"registration_number": "2135654", "name": "KARLLOS MIGUEL PONCIO GOMES", "status": "MATRICULADO"},
  {"registration_number": "2533132", "name": "KETILYN VITÓRIA TEIXEIRA RODRIGUES", "status": "MATRICULADO"},
  {"registration_number": "2533357", "name": "LAURA BEATRYZ JUNQUEIRA PASCOAL", "status": "MATRICULADO"},
  {"registration_number": "2137180", "name": "LETYCIA MARIA PAÇOS DA SILVA", "status": "MATRICULADO"},
  {"registration_number": "2137088", "name": "LUCAS ALEXSSANDRO PEREIRA DE ASSIS", "status": "MATRICULADO"},
  {"registration_number": "2137425", "name": "LUIZ ANTONIO PINTO DE FREITAS", "status": "MATRICULADO"},
  {"registration_number": "2483273", "name": "LUIZA EMANUELLY MARQUES ALMEIDA", "status": "TRANSFERIDO DA TURMA"},
  {"registration_number": "2522831", "name": "MAIKEL COUTLEM DO NASCIMENTO MENDES", "status": "MATRICULADO"},
  {"registration_number": "2137454", "name": "MATEUS CAMARGO RODRIGUES", "status": "TRANSFERIDO DA ESCOLA"},
  {"registration_number": "2137142", "name": "NATHALIA NASCIMENTO MARANHÃO", "status": "MATRICULADO"},
  {"registration_number": "2331985", "name": "PABLO DA SILVA OLIVEIRA", "status": "MATRICULADO"},
  {"registration_number": "2153584", "name": "PATRICK RYAN FERREIRA DOS SANTOS", "status": "MATRICULADO"},
  {"registration_number": "2522433", "name": "PAULO VITHOR DE SOUZA LIMA", "status": "MATRICULADO"},
  {"registration_number": "2534578", "name": "PEDRO MYGUELL SILVA BRITO", "status": "MATRICULADO"},
  {"registration_number": "2135648", "name": "THALLYSON NEVES DE OLIVEIRA", "status": "MATRICULADO"},
  {"registration_number": "2522836", "name": "VINICIUS COSER DE JESUS", "status": "MATRICULADO"},
  {"registration_number": "2551757", "name": "LUAN BARBOSA MOREIRA", "status": "MATRICULADO"},
  {"registration_number": "2545854", "name": "MARIANA LEAL", "status": "MATRICULADO"},
  {"registration_number": "2511057", "name": "ARTHUR MANOEL GONÇALVES BRANCO", "status": "MATRICULADO"}
];

async function run() {
  try {
    console.log(`Upserting ${studentsData.length} students...`);
    const { data: upsertedStudents, error: upsertError } = await supabase
      .from('students')
      .upsert(studentsData, { onConflict: 'registration_number' })
      .select('id, registration_number, name, status');

    if (upsertError) throw upsertError;
    console.log('Students upserted successfully.');

    // Delete existing enrollments for this class
    await supabase.from('enrollments').delete().eq('classroom_id', CLASSROOM_ID);

    // Filter students with status "MATRICULADO"
    const activeStudentIds = upsertedStudents
      .filter(s => s.status === 'MATRICULADO')
      .map(s => s.id);

    const enrollmentsToInsert = activeStudentIds.map(sid => ({
      classroom_id: CLASSROOM_ID,
      student_id: sid
    }));

    const { error: enrollError } = await supabase.from('enrollments').insert(enrollmentsToInsert);
    if (enrollError) throw enrollError;

    // Update PAED status
    await supabase.from('students').update({ paed: true }).in('registration_number', ['2165814', '1977800']);

    console.log(`Update complete! ${activeStudentIds.length} students enrolled in 8º ANO B.`);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
