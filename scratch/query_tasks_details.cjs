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
  console.log('Querying maintenance tasks...');
  const { data: podcastTasks, error: err1 } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('area_name', 'Podcast/Gremio');

  const { data: sala12Tasks, error: err2 } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('area_name', 'Sala 12');

  console.log('Podcast/Gremio tasks count:', podcastTasks ? podcastTasks.length : 0);
  console.log(JSON.stringify(podcastTasks, null, 2));

  console.log('Sala 12 tasks count:', sala12Tasks ? sala12Tasks.length : 0);
  console.log(JSON.stringify(sala12Tasks, null, 2));
}

run();
