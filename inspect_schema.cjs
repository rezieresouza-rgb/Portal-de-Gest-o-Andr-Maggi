const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function checkSchema() {
  const { data, error } = await supabase.from('consumption_statements').select('*').limit(1);
  if (error) {
      console.error(error);
  } else {
      console.log("All Columns in consumption_statements:", Object.keys(data[0] || {}));
  }
}

checkSchema();
