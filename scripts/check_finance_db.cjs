require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: funds, error: fErr } = await supabase.from('funds').select('*');
  console.log('Funds count:', funds?.length, 'error:', fErr?.message);
  console.log('Funds:', funds);

  const { data: txs, error: tErr } = await supabase.from('transactions').select('*');
  console.log('Transactions count:', txs?.length, 'error:', tErr?.message);
  if (txs && txs.length > 0) {
    console.log('Sample transactions:', txs.slice(0, 5));
  }
}

check();
