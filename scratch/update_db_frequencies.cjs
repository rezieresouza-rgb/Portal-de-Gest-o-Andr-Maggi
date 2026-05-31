const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  console.log('Renaming frequency "BIMESTRAL" to "TRIMESTRAL" in maintenance_tasks...');
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update({ frequency: 'TRIMESTRAL' })
    .eq('frequency', 'BIMESTRAL')
    .select();

  if (error) {
    console.error('Error updating frequencies:', error);
  } else {
    console.log('Updated tasks count:', data ? data.length : 0);
  }
}

run();
