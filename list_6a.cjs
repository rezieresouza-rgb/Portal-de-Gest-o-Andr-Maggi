const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function findA() {
  const { data: rooms } = await supabase.from('classrooms').select('id, name');
  rooms.forEach(r => {
    if (r.name.includes('6') && r.name.includes('A')) {
      console.log(`MATCH: ${r.name} ID: ${r.id}`);
    }
  });
}
findA();
