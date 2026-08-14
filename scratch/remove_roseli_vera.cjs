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

async function updateStaff() {
  const ids = ['1771450396941.8145', '1771450397267.734'];

  const { data, error } = await supabase
    .from('staff')
    .update({
      status: 'INATIVO',
      role: 'INATIVO',
      job_function: 'INATIVO'
    })
    .in('id', ids)
    .select();

  if (error) {
    console.error('Error updating staff:', error);
  } else {
    console.log('Successfully updated status to INATIVO for Roseli and Vera Lucia Bento:', data);
  }
}

updateStaff();
