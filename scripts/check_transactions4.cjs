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
    fs.writeFileSync('tx.json', JSON.stringify(txs, null, 2));
}

main();
