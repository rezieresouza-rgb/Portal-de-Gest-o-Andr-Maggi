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
  console.log('Starting database updates...');

  // 1. Rename "Podcast/Gremio" to "Sala 09"
  console.log('Renaming "Podcast/Gremio" to "Sala 09"...');
  const { data: updated, error: errUpdate } = await supabase
    .from('maintenance_tasks')
    .update({ area_name: 'Sala 09' })
    .eq('area_name', 'Podcast/Gremio')
    .select();

  if (errUpdate) {
    console.error('Error renaming:', errUpdate);
  } else {
    console.log('Renamed tasks count:', updated ? updated.length : 0);
    console.log(updated);
  }

  // 2. Delete "Sala 12"
  console.log('Deleting "Sala 12" tasks...');
  const { data: deleted, error: errDelete } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('area_name', 'Sala 12')
    .select();

  if (errDelete) {
    console.error('Error deleting:', errDelete);
  } else {
    console.log('Deleted tasks count:', deleted ? deleted.length : 0);
    console.log(deleted);
  }

  console.log('Database updates completed.');
}

run();
