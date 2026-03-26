
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

const CLASSROOM_ID = 'e8c4608c-9a49-445a-939e-2dc37667d4ce'; // 8º ANO A

const studentsData = [
  {"registration_number": "2535543", "name": "ALEXANDRE JUNIOR SANTOS AQUINO", "status": "TRANSFERIDO DA ESCOLA", "paed": false},
  {"registration_number": "2127410", "name": "AMANDA CARVALHO LUIZ", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2522851", "name": "ANDRÉ MENDES DE OLIVEIRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2517848", "name": "ANTHONY MIGUEL ALVES DE MELO DUTRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2126894", "name": "DANIELE GOMES DE BRITO MARQUES", "status": "MATRICULADO", "paed": true},
  {"registration_number": "2165433", "name": "DIEGO DIONISIO TONIATO", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2545898", "name": "DIORENE ASHLEY MACKENZIE PEREZ GUZMAN", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2283371", "name": "FABIANA ALANA FROIS SANITA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2522876", "name": "GABRIELLY RODRIGUES PAZINI", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2127918", "name": "GABRYELLE DE OLIVEIRA ALVES", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2282837", "name": "GUSTAVO GONSALVES FERREIRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2517841", "name": "HALLANA GABRIELLY DOS SANTOS CASTRO", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2126535", "name": "HELOIZA MANTOVANI DE OLIVEIRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2522296", "name": "JOÃO PAULO FIDELIS SOUZA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2517837", "name": "JOÃO VICTOR DA SILVA ALVES", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2483870", "name": "LAUANE AMORIM WESTPHAL", "status": "MATRICULADO", "paed": false},
  {"registration_number": "491301", "name": "LETICIA MARCELLY AZEVEDO PEREIRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2151557", "name": "LUIS HENRIQUE LANGRAF DA SILVA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2483863", "name": "RAFFAELLA VITORYA GARCIA DOS SANTOS", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2123769", "name": "RAY CARLOS FERREIRA DOS SANTOS", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2127101", "name": "VITOR GABRIEL DIAS PEREIRA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2523200", "name": "YAGO RICARDO DA SILVA MERGULHÃO", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2517535", "name": "YANI FAUSTINO MENDES", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2530182", "name": "KAUAN RAFAEL NUNES DA SILVA", "status": "MATRICULADO", "paed": false},
  {"registration_number": "2038585", "name": "DOUGLAS GOMES DE BRITO", "status": "MATRICULADO", "paed": false}
];

async function run() {
  try {
    console.log(`Upserting ${studentsData.length} students...`);
    // Remove paed if it still causes issues or make sure it is boolean
    const { data: upsertedStudents, error: upsertError } = await supabase
      .from('students')
      .upsert(studentsData, { onConflict: 'registration_number' })
      .select();

    if (upsertError) throw upsertError;
    console.log('Students upserted successfully.');

    // Delete existing enrollments for this class
    console.log(`Deleting existing enrollments for class ${CLASSROOM_ID}...`);
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('classroom_id', CLASSROOM_ID);

    if (deleteError) throw deleteError;

    // Filter students with status "MATRICULADO"
    const activeStudentIds = upsertedStudents
      .filter(s => s.status === 'MATRICULADO')
      .map(s => s.id);

    const enrollmentsToInsert = activeStudentIds.map(sid => ({
      classroom_id: CLASSROOM_ID,
      student_id: sid
    }));

    console.log(`Inserting ${enrollmentsToInsert.length} enrollments...`);
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert(enrollmentsToInsert);

    if (enrollError) throw enrollError;

    console.log('Update complete! 24 students enrolled in 8º ANO A.');

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
