const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('staff')
    .select('name, status, role, server_type');
    
  console.log(data.find(s => s.name.toLowerCase().includes('adriana')));
}

main();
