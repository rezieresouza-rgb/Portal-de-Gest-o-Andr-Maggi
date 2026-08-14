const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const index = line.indexOf('=');
  if (index !== -1) {
    env[line.substring(0, index).trim()] = line.substring(index + 1).trim();
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  console.log('Running migration to add execution_dates column...');
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: 'ALTER TABLE preventive_maintenance_plan ADD COLUMN IF NOT EXISTS execution_dates jsonb;'
  });
  
  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration succeeded! Result:', data);
  }
}

run();
