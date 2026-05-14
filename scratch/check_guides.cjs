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

async function checkSchema() {
  const { data, error } = await supabase.from('payment_guides').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    if (data && data.length > 0) {
      Object.keys(data[0]).forEach(k => console.log(k));
    } else {
      console.log("No data found to infer columns.");
      // Fallback: try to select from information_schema if possible, or just try to insert a dummy field
    }
  }
}

checkSchema();
