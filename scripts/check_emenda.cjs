require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: txs, error } = await supabase.from('transactions').select('*');
  if (error) console.error(error);
  
  console.log('Total transactions:', txs?.length);
  
  const entries = txs?.filter(t => t.type === 'ENTRY') || [];
  console.log('Total entries:', entries.length);
  entries.forEach(e => {
    console.log(`[ENTRY] Fund: ${e.fund_id} | Desc: ${e.description} | Cat: ${e.category} | Val: R$ ${e.gross_value} | Date: ${e.date}`);
  });
}

check();
