
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
    const { data, error } = await supabase.from('students').select('id, name, registration_number, paed, school_transport').limit(5);
    if (error) {
        console.error('Error selecting specific columns:', error.message);
        // If error, maybe names are different. Let's try to get all columns from information_schema via a trick.
        const { data: cols, error: errCols } = await supabase.rpc('get_table_columns', { table_name: 'students' });
        if (errCols) {
            console.log('RPC get_table_columns not available.');
        } else {
            console.log('Columns from RPC:', cols);
        }
    } else {
        console.log('Row 1:', data[0]);
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
