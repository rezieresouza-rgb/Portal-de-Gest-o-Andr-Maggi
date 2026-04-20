require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('users')
    .select('role');

  if (error) {
    console.error('Error fetching:', error);
  } else {
    const roles = [...new Set(data.map(u => u.role))];
    console.log('Distinct roles:', roles);
  }
}

main();
