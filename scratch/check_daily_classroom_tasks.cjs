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
  console.log('Querying daily classroom tasks...');
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('frequency', 'DIARIA')
    .ilike('area_name', 'Sala%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} tasks:`);
  for (const t of data) {
    console.log(`ID: ${t.id} | Block: "${t.block}" | Area: "${t.area_name}"`);
    console.log(`Description: "${t.task_description}"`);
    console.log('----------------------------------------------------');
  }
}

run();
