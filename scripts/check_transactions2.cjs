const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: txs, error } = await supabase.from('transactions').select('id, description, type, value').limit(20);
    if (error) {
        return console.error("Error:", error);
    }
    console.log("Found " + txs.length + " transactions");
    txs.forEach(t => console.log(`- [${t.id}] ${t.type}: ${t.description} (R$ ${t.value})`));
}

main();
