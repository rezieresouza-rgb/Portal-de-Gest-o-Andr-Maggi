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
  console.log(`TOTAL ROOMS: ${rooms.length}`);
  rooms.forEach(r => {
    const is6 = r.name.includes('6');
    const isA = r.name.includes('A') || r.name.includes('a');
    if (is6 && isA) {
        console.log(`MATCH -> ID: ${r.id} | Name: "${r.name}" | Yr: ${r.year} | Shift: ${r.shift}`);
    }
  });
}
deeplyCheck();
