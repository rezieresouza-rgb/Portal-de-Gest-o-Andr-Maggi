const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  const index = line.indexOf('=');
  if (index !== -1) {
    const key = line.substring(0, index).trim();
    const value = line.substring(index + 1).trim();
    env[key] = value;
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function checkSchema() {
  const { data, error } = await supabase.from('consumption_statements').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    // Print each column on a new line to avoid truncation
    Object.keys(data[0] || {}).forEach(k => console.log(k));
  }
}

checkSchema();
