
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
    // Buscar nomes das colunas de novo só pra ter certeza
    const { data: colsData, error: colsError } = await supabase.from('students').select('*').limit(1);
    if (colsError) throw colsError;
    console.log('Colunas reais:', Object.keys(colsData[0]));

    const { data, error } = await supabase
      .from('students')
      .select('name, updated_at, class_id')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Últimas atualizações na Secretaria:');
    data.forEach(s => {
        console.log(`- Aluno: ${s.name} | ClassID: ${s.class_id} | Atualizado: ${s.updated_at}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
