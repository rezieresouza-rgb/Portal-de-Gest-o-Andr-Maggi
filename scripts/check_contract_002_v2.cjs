
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
    const { data: contracts, error: cError } = await supabase
      .from('contracts')
      .select('*, supplier:suppliers(*)')
      .ilike('number', '%002/2026%');

    if (cError) throw cError;

    fs.writeFileSync(path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', 'scripts', 'check_contract_002_results.json'), JSON.stringify(contracts, null, 2), 'utf8');
    console.log('Contratos encontrados:', contracts.length);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
