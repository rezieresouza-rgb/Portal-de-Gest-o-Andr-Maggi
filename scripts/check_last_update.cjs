
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
    const { data, error } = await supabase
      .from('students')
      .select('class_name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log('Últimas atualizações na tabela de alunos:');
    data.forEach(s => {
        console.log(`- Turma: ${s.class_name} | Atualizado em: ${s.updated_at}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
