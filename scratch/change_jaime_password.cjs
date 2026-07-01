const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const userId = 'e308347a-4295-4edb-84bb-8e86e1ac547f';
  const newPassword = 'jaime123';
  
  console.log(`Updating password for JAIME DE SOUZA COSTA (ID: ${userId}) to '${newPassword}'...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: newPassword })
    .eq('id', userId)
    .select();
    
  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log("Success! Updated user:", data);
  }
}

main();
