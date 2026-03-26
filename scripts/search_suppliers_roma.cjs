
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
    console.log('Buscando fornecedores relacionados a Maripa/Roma...');
    const { data: sups, error: sError } = await supabase
      .from('suppliers')
      .select('*')
      .or('name.ilike.%ROMA%,name.ilike.%MARIPA%,cnpj.eq.50.387.266/0001-07,cnpj.eq.41.144.375/0001-20');

    if (sError) throw sError;

    console.log('Fornecedores encontrados:', sups.length);
    fs.writeFileSync(path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', 'scripts', 'search_suppliers_roma_results.json'), JSON.stringify(sups, null, 2), 'utf8');

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
