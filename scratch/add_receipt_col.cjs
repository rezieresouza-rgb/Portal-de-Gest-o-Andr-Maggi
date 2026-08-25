const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOrAddCol() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Testing receipt_number column...");

  const { data, error } = await supabase.from('transactions').select('receipt_number').limit(1);

  if (error) {
    console.log("receipt_number column doesn't exist yet:", error.message);
    // Let's try inserting with RPC or checking if we can use execute_sql tool if lazy loaded
  } else {
    console.log("receipt_number column EXISTS!");
  }
}

checkOrAddCol();
