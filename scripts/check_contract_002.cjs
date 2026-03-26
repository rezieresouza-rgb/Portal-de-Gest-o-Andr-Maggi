
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
    console.log('Buscando contrato 002/2026...');
    const { data: contracts, error: cError } = await supabase
      .from('contracts')
      .select('*, supplier:suppliers(*)')
      .ilike('number', '%002/2026%');

    if (cError) throw cError;

    if (!contracts || contracts.length === 0) {
      console.log('Contrato 002/2026 não encontrado.');
      return;
    }

    contracts.forEach(c => {
      console.log('ID Contrato:', c.id);
      console.log('Número:', c.number);
      console.log('Supplier ID:', c.supplier_id);
      console.log('Supplier Current Info:', c.supplier);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
