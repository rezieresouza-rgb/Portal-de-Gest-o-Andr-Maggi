
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
    // 1. Tentar pegar as colunas de enrollments
    const { data: cols, error: errCols } = await supabase.from('enrollments').select('*').limit(1);
    if (errCols) throw errCols;
    console.log('Enrollments columns:', Object.keys(cols[0]));

    // 2. Buscar as mais recentes
    const { data: latest, error: errLatest } = await supabase
      .from('enrollments')
      .select('classroom_id, created_at, classroom:classrooms(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (errLatest) throw errLatest;

    console.log('\nÚltimas matrículas/alterações de enturmação:');
    latest.forEach(e => {
        console.log(`- Turma: ${e.classroom?.name} | Criado em: ${e.created_at}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
