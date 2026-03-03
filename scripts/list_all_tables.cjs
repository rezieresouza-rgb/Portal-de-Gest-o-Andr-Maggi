
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Fetching all tables in public schema...');
    const { data, error } = await supabase.rpc('execute_sql_query', {
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    });

    // If RPC is not available, try raw query through a fallback or just listing known ones
    if (error) {
        console.log('RPC execute_sql_query failed, trying direct query if possible...');
        // Some supabase setups have a 'query' or similar. 
        // If not, we might have to rely on the ones we found in the code.
        console.error('Error fetching tables:', error.message);
    } else {
        console.log('Tables found:');
        data.forEach(t => console.log(`- ${t.table_name}`));
    }
}

listTables();
