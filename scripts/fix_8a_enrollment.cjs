
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

const registrationNumbers = [
  "2127410", "2522851", "2517848", "2126894", "2165433", "2545898", "2283371", "2522876", "2127918", "2282837",
  "2517841", "2126535", "2522296", "2517837", "2483870", "491301", "2151557", "2483863", "2123769", "2127101",
  "2523200", "2517535", "2530182", "2038585"
];

async function run() {
  try {
    // 1. Buscar IDs dos alunos pelos números de matrícula
    console.log('Buscando IDs dos alunos...');
    const { data: students, error: sError } = await supabase
      .from('students')
      .select('id, registration_number')
      .in('registration_number', registrationNumbers);

    if (sError) throw sError;
    console.log(`Encontrados ${students.length} alunos no banco.`);

    // 2. Limpar enturmação antiga desta turma
    await supabase.from('enrollments').delete().eq('classroom_id', CLASSROOM_ID);

    // 3. Inserir novas enturmações
    const enrollments = students.map(s => ({
      classroom_id: CLASSROOM_ID,
      student_id: s.id
    }));

    const { error: iError } = await supabase.from('enrollments').insert(enrollments);
    if (iError) throw iError;

    console.log(`Sucesso! ${enrollments.length} alunos enturmados no 8º ANO A.`);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
