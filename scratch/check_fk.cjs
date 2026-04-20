require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('get_table_constraints', { table_name: 'staff_movements' });
  if (error) {
     console.log("RPC get_table_constraints failed. Trying alternative...");
     // Usually there is no such RPC. 
  }
  
  // Alternative: Try to insert a non-existent ID
  const { error: fkError } = await supabase.from('staff_movements').insert([{
    staff_id: '1771450399537.026', // Known valid staff ID
    type: 'RETORNO',
    start_date: '2026-01-01',
    substitute_id: 'NON_EXISTENT_ID'
  }]);

  if (fkError && fkError.message.includes('foreign key constraint')) {
    console.log("Column 'substitute_id' has a FOREIGN KEY constraint.");
  } else {
    console.log("Column 'substitute_id' does NOT have a strict FK constraint (or it succeeded).");
    if (!fkError) await supabase.from('staff_movements').delete().eq('substitute_id', 'NON_EXISTENT_ID');
  }
}

main();
