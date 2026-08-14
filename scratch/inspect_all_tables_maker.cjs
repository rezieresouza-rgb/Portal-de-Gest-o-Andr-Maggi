const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const index = line.indexOf('=');
  if (index !== -1) {
    const key = line.substring(0, index).trim();
    const value = line.substring(index + 1).trim();
    env[key] = value;
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function inspectAll() {
  const tables = ['cleaning_tasks', 'cleaning_environments', 'maintenance_tasks', 'cleaning_occurrences'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.log(`Table ${table} error:`, error.message);
        continue;
      }
      if (data) {
        const matches = data.filter(row => JSON.stringify(row).toUpperCase().includes('MONITORIA') || JSON.stringify(row).toUpperCase().includes('LABORATÓRIO') || JSON.stringify(row).toUpperCase().includes('LABORATORIO'));
        console.log(`Table '${table}': found ${matches.length} matches`);
        matches.forEach(m => console.log('   Row:', m.id, m.name || m.area_name || m.title || m.block));
      }
    } catch (e) {
      console.log(`Table ${table} exception:`, e.message);
    }
  }
}

inspectAll();
