
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

async function check() {
  try {
    const { data: students, error: sError } = await supabase
      .from('students')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sError) throw sError;

    console.log('Últimos registros de alunos:');
    students.forEach(s => {
        console.log(`- Aluno: ${s.name} | Criado: ${s.created_at}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
