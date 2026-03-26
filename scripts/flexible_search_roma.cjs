
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
    const { data: sups, error: sError } = await supabase
      .from('suppliers')
      .select('*')
      .or('name.ilike.%ROMA%,name.ilike.%MARIPA%,full_name.ilike.%ROMA%,full_name.ilike.%MARIPA%');

    if (sError) throw sError;

    console.log('Suppliers found:', sups.length);
    sups.forEach(s => {
        console.log(`- ${s.name} (${s.id}) | CNPJ: ${s.cnpj}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
