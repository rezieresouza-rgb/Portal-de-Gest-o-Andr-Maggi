require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'staff_movements' });
  // If rpc doesn't exist, we'll try a different way.
  // Actually, I'll just try to insert a non-UUID string.
  
  const { error: insertError } = await supabase.from('staff_movements').insert([{
    staff_id: 'test',
    type: 'RETORNO',
    start_date: '2026-01-01',
    substitute_id: 'ID1,ID2'
  }]);

  if (insertError) {
    console.log("Error inserting comma-separated string:", insertError.message);
  } else {
    console.log("Successfully inserted comma-separated string. Column is likely TEXT.");
    // Cleanup
    await supabase.from('staff_movements').delete().eq('staff_id', 'test');
  }
}

main();
