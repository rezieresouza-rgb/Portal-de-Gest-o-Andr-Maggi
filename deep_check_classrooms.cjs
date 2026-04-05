const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function deeplyCheck() {
  const { data: rooms } = await supabase.from('classrooms').select('*');
  console.log("ALL CLASSROOMS IN DATABASE:");
  rooms.forEach(r => {
    if (r.name.toUpperCase().includes('6') && r.name.toUpperCase().includes('A')) {
        console.log(`ID: ${r.id} | Name: "${r.name}" | Year: ${r.year} | Shift: ${r.shift}`);
    }
  });
}
deeplyCheck();
