
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

async function checkSchema() {
  try {
    // We can try to get an existing student to see the columns
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (error) throw error;
    
    if (students.length > 0) {
      console.log('Colunas da tabela students:');
      console.log(Object.keys(students[0]).join(', '));
      console.log('Exemplo de valores:');
      console.log(JSON.stringify(students[0], null, 2));
    } else {
      console.log('Nenhum aluno encontrado para verificar esquema.');
    }

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

checkSchema();
