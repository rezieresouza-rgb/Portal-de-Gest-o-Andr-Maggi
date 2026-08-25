const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function addCol() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Trying RPC or sql...");
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_number text;' });
    console.log("RPC result:", data, error);
  } catch (e) {
    console.log("RPC error:", e);
  }
}

addCol();
