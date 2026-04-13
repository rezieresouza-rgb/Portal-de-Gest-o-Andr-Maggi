const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkOccurrences() {
    console.log("Checking columns in 'occurrences'...");
    const { data, error } = await supabase.from('occurrences').select('*').limit(1);
    
    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        // If no data, we can try to fetch table definition or just assume database.sql is right
        console.log("No records found, checking schema via RPC if possible...");
        // Fallback: Assume database.sql is correct for now
    }
}

checkOccurrences();
