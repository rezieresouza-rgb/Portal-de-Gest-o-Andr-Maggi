const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkCols() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching 1 row from transactions table...");

  const { data, error } = await supabase.from('transactions').select('*').limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in transactions:', Object.keys(data[0] || {}));
  }
}

checkCols();
