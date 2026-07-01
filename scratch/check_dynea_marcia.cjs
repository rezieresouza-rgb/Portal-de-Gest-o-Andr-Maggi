const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const matches = users.filter(u => 
    (u.name && (u.name.toLowerCase().includes('dynea') || u.name.toLowerCase().includes('favero')))
  );

  console.log("Users found:", JSON.stringify(matches, null, 2));
}

main();
