
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

async function run() {
  try {
    const supplierId = '73e77103-6489-444d-b16a-46b05bf0ad04'; // MARIPA ROMA (old MARIA ROMA)
    const newPhone = '66 99231-5431';

    console.log(`Atualizando telefone do fornecedor ${supplierId}...`);
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        phone: newPhone
      })
      .eq('id', supplierId)
      .select();

    if (error) throw error;

    console.log('Sucesso! Telefone atualizado:', data[0].phone);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
