require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Updating existing chromebook bookings for Station 05...");
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ resource_id: 'Estação 05 biblioteca/armário' })
    .eq('resource_type', 'CHROMEBOOKS')
    .eq('resource_id', 'Estação 05 (biblioteca)');

  if (error) {
    console.error("Error updating bookings:", error);
  } else {
    console.log("Successfully updated existing records.");
  }
}

main();
