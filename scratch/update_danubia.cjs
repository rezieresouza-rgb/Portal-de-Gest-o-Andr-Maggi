const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function updateDanubia() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Updating Danubia's role to MEDIAÇÃO in Supabase...");

  const { data, error } = await supabase
    .from('users')
    .update({ role: 'MEDIAÇÃO' })
    .ilike('name', '%DANUBIA%')
    .select();

  if (error) {
    console.error('Error updating Danubia:', error);
  } else {
    console.log('Danubia updated successfully:', JSON.stringify(data, null, 2));
  }
}

updateDanubia();
