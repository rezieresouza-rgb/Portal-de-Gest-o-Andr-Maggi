const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function updateName() {
  const { data, error } = await supabase
    .from('students')
    .update({ name: 'CRISLAINI VICTORIA FARIAS DE ALMEIDA' })
    .eq('registration_number', '2669069')
    .select();

  if (error) {
    console.error('Error updating name:', error);
  } else {
    console.log('Update successful:', data);
  }
}

updateName();
