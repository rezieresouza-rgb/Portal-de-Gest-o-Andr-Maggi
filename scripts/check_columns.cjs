const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
    console.log("Checking actual columns in 'library_books'...");
    const { data, error } = await supabase.from('library_books').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching data:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found in first record:", Object.keys(data[0]));
    } else {
        console.log("No data found in table to check columns.");
    }
}

checkCols();
