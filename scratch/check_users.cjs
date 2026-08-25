const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkUsers() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Searching users in Supabase...");

  // Try different user tables
  for (const tableName of ['users', 'system_users', 'profiles', 'secretariat_staff']) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && data) {
        console.log(`\nTable '${tableName}' (total ${data.length}):`);
        const matched = data.filter(u => {
          const str = JSON.stringify(u).toLowerCase();
          return str.includes('danubia') || str.includes('rafael') || str.includes('anaiara');
        });
        console.log(JSON.stringify(matched, null, 2));
      }
    } catch (e) {}
  }
}

checkUsers();
