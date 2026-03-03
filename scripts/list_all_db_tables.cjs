
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing all accessible tables via postgrest...');
    // We can't directly query information_schema via standard supabase-js unless exposed.
    // But we can try to find them by checking the schema cache or just trying names.
    // However, a better way is to use the RPC if it exists, or just use the list I have but be more aggressive.

    // Let's try to fetch from information_schema.tables directly if allowed (often not).
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');

    if (error) {
        console.log('Error querying information_schema.tables:', error.message);
        console.log('Trying alternative: searching for common names I might have missed.');
    } else {
        console.log('Tables found:', data.map(t => t.table_name).join(', '));
    }
}

listTables();
