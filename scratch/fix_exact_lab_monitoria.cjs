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

async function fixExact() {
  const { data: tasks, error } = await supabase
    .from('maintenance_tasks')
    .select('*');

  if (error) {
    console.error('Error fetching maintenance_tasks:', error);
    return;
  }

  let count = 0;
  for (const t of tasks) {
    if (t.area_name && t.area_name.toLowerCase().includes('monitoria')) {
      const newAreaName = 'MONITORIA CÍVICO-MILITAR';
      console.log(`Fixing task ${t.id}: '${t.area_name}' -> '${newAreaName}'`);
      await supabase
        .from('maintenance_tasks')
        .update({ area_name: newAreaName })
        .eq('id', t.id);
      count++;
    }
  }
  console.log(`Successfully updated ${count} tasks in maintenance_tasks!`);
}

fixExact();
