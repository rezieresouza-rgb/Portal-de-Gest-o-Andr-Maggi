const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id')
    .ilike('number', '%010/2026%');

  if (contracts && contracts.length > 0) {
    const { data: events } = await supabase
      .from('contract_events')
      .select('*')
      .eq('contract_id', contracts[0].id)
      .ilike('description', '%BEBIDA%');
    console.log("Bebida Láctea Contract Events:", events);
  }
}

run();
