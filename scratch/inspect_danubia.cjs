const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%danubia%');

  if (error) {
    console.error(error);
    return;
  }

  console.log("Danubia users:", JSON.stringify(users, null, 2));
}

main();
