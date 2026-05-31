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
  const { data, error } = await supabase.from('school_environments').select('*');
  if (error) {
    console.error('Error fetching environments:', error);
    return;
  }
  console.log('ENVIRONMENTS ROW DATA:');
  console.log(JSON.stringify(data, null, 2));
}

run();
