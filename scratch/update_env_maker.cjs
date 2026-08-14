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

async function updateMakerEnv() {
  // Update cleaning_environments
  const { data: envs, error: envError } = await supabase
    .from('cleaning_environments')
    .select('*');

  if (envError) {
    console.error('Error fetching environments:', envError);
  } else if (envs) {
    console.log('Current environments:', envs.map(e => `${e.id}: ${e.name}`));
    const makerEnv = envs.find(e => e.name.includes('MAKER'));
    if (makerEnv) {
      const { data: updated, error: updErr } = await supabase
        .from('cleaning_environments')
        .update({ name: 'MONITORIA CÍVICO-MILITAR' })
        .eq('id', makerEnv.id)
        .select();

      console.log('Updated cleaning_environments:', updated, updErr);
    }
  }

  // Also check if there are tasks with area_name or block mentioning MAKER
  const { data: tasks, error: taskError } = await supabase
    .from('maintenance_tasks')
    .select('*');

  if (tasks) {
    const makerTasks = tasks.filter(t => (t.area_name || '').toUpperCase().includes('MAKER') || (t.task_description || '').toUpperCase().includes('MAKER'));
    console.log(`Found ${makerTasks.length} tasks with MAKER in maintenance_tasks`);
    for (const t of makerTasks) {
      const newAreaName = t.area_name.replace(/MAKER/gi, 'MONITORIA CÍVICO-MILITAR');
      await supabase.from('maintenance_tasks').update({ area_name: newAreaName }).eq('id', t.id);
    }
  }
}

updateMakerEnv();
