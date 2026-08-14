const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function inspectItems() {
  const { data } = await supabase
    .from('merenda_inventory_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (data && data[0]) {
    const items = typeof data[0].items === 'string' ? JSON.parse(data[0].items) : data[0].items;
    console.log('Total items in sample:', items.length);
    console.log('Sample items slice (first 10):');
    items.slice(0, 10).forEach(i => console.log(i));
  }
}

inspectItems();
