
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
      .eq('id', 'sup-casa-carne-roma');

    if (sError) throw sError;

    console.log('Supplier sup-casa-carne-roma:', sups);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
