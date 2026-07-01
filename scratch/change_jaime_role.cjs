const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const userId = 'e308347a-4295-4edb-84bb-8e86e1ac547f';
  const newRole = 'GESTAO';
  
  console.log(`Updating role for JAIME DE SOUZA COSTA (ID: ${userId}) to '${newRole}'...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    .select();
    
  if (error) {
    console.error("Error updating role:", error);
  } else {
    console.log("Success! Updated user:", data);
  }
}

main();
