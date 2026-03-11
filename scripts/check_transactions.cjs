const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: txs, error } = await supabase.from('transactions').select('*').limit(20);
    if (error) {
        console.error("Error fetching transactions:", error);
        process.exit(1);
    }

    console.log("Transactions found:");
    console.log(JSON.stringify(txs, null, 2));
}

main();
