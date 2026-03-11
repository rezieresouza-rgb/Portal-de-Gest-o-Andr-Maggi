const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', '00fd9b76-0cf5-48b6-9a36-4cce8d668aed');

    if (error) {
        console.error("Error deleting:", error);
    } else {
        console.log("Successfully deleted test transaction (REPASSE MERENDA PNAE).");
    }
}

main();
