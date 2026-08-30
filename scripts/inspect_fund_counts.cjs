require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  const { data: funds } = await supabase.from('funds').select('*');
  const { data: txs } = await supabase.from('transactions').select('id, fund_id');

  console.log('Total funds in DB:', funds?.length);
  funds?.forEach(f => {
    const count = txs?.filter(t => t.fund_id === f.id).length || 0;
    console.log(`Fund ID: ${f.id} | Name: "${f.name}" | FullName: "${f.full_name}" | Tx Count: ${count}`);
  });
}

inspect();
