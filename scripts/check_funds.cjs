const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: funds, error } = await supabase.from('funds').select('*');
    if (error) {
        return console.error("Error:", error);
    }
    fs.writeFileSync('funds.json', JSON.stringify(funds, null, 2));
}

main();
