const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Adding columns to 'library_books'...");
    
    // We try to add columns one by one. If they already exist, it will error but that's fine.
    // Note: Supabase JS client doesn't have a direct raw SQL execution unless specific extensions are enabled.
    // Since I don't have direct SQL access through MCP, I'll attempt to use RPC if available or common knowledge.
    // Actually, usually I should ask the user to run SQL in the dashboard if I can't.
    // But let me try if I can find an RPC to execute SQL or just use the management API?
    // I don't have the management API key.

    // I'll try to use a simple query to see if the columns exist first by fetching one record.
    const { data, error } = await supabase.from('library_books').select('internal_registration, registration_date').limit(1);
    
    if (error && error.code === 'PGRST204') { // Column does not exist
        console.log("Columns don't exist. Please run this SQL in your Supabase SQL Editor:");
        console.log(`
            alter table public.library_books 
            add column if not exists internal_registration text,
            add column if not exists registration_date date default now();
        `);
    } else {
        console.log("Columns already exist or another error occurred:", error);
    }
}

migrate();
