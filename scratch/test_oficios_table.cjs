const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testSupabaseOficios() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.log('No Supabase credentials found in .env.local');
    return;
  }

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  console.log('Connecting to Supabase:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('school_oficios').select('*');
  if (error) {
    console.log('Supabase table error:', error.message, error.details, error.code);
  } else {
    console.log('Successfully queried school_oficios! Total rows:', data.length);
    console.log('Data:', data);
  }
}

testSupabaseOficios();
