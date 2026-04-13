const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function findStudent() {
  const { data, error } = await supabase
    .from('students')
    .select('name, registration_number')
    .ilike('name', '%EMILLY VITORIA%');
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

findStudent();
