require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%Marcia%');

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Found users:', data);
  }
}

main();
