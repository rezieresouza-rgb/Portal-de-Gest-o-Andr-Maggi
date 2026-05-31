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
  const { data: classrooms, error } = await supabase.from('classrooms').select('*');
  if (error) {
    console.error('Error fetching classrooms:', error);
    return;
  }
  console.log('CLASSROOMS ROW DATA:');
  console.log(JSON.stringify(classrooms, null, 2));
}

run();
