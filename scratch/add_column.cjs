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

async function addColumn() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: 'ALTER TABLE payment_guides ADD COLUMN IF NOT EXISTS order_number TEXT;'
  });
  
  if (error) {
    // If rpc execute_sql doesn't exist, this might fail. 
    // But sometimes these projects have a helper RPC for SQL.
    console.error("RPC failed, trying raw query if possible or just assuming column might be needed:", error);
  } else {
    console.log("Column added successfully via RPC.");
  }
}

addColumn();
