const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testTables() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  const tablesToTest = ['school_oficios', 'civic_documents', 'referrals', 'psychosocial_referrals', 'occurrences', 'psychosocial_notifications'];
  
  for (const t of tablesToTest) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': ERROR -> ${error.message} (code ${error.code})`);
    } else {
      console.log(`Table '${t}': EXISTS! (rows: ${data.length})`);
    }
  }
}

testTables();
