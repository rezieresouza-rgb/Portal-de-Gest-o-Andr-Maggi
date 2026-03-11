const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: txs, error } = await supabase.from('transactions').select('id, description, type, net_value');
    if (error) {
        return console.error("Error:", error);
    }
    const testTxs = txs.filter(t => t.description && t.description.toLowerCase().includes('test'));
    console.log("Found " + testTxs.length + " test transactions");
    testTxs.forEach(t => console.log(`- [${t.id}] ${t.type}: ${t.description} (R$ ${t.net_value})`));
}

main();
