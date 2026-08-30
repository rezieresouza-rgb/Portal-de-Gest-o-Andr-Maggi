require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
  const emptyFundIds = [
    'b7087911-d164-4fd6-b00f-97b229fe1c21',
    'a6edda1c-51d2-49ef-82ba-a90a7bd677b9',
    '1eabf864-3e45-40ee-912b-061c59d9b096',
    'dbafe710-53d3-4e63-ad12-041eaf209eb1'
  ];

  for (const id of emptyFundIds) {
    const { error } = await supabase.from('funds').delete().eq('id', id);
    console.log(`Deleted empty fund ${id}:`, error ? error.message : 'SUCCESS');
  }

  const { data: remaining } = await supabase.from('funds').select('*');
  console.log('Remaining funds:', remaining);
}

cleanup();
