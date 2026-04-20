require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: users, error } = await supabase.from('users').select('id, name, role, login');
  if (error) {
    console.error(error);
  } else {
    console.table(users);
  }
}

main();
