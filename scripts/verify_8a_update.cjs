
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

async function verify() {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('students (name, registration_number, status, paed)')
      .eq('classroom_id', CLASSROOM_ID);

    if (error) throw error;

    console.log(`Turma 8º ANO A - Total: ${data.length} alunos.`);
    data.forEach((e, idx) => {
        const s = e.students;
        console.log(`${idx+1}. [${s.registration_number}] ${s.name} | Status: ${s.status} | PAED: ${s.paed}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

verify();
