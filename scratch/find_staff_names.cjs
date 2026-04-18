const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findStaff() {
    console.log('Searching for Zenir and Angela in staff table...');
    const { data, error } = await supabase
        .from('staff')
        .select('name')
        .or('name.ilike.%Zenir%,name.ilike.%Angela%');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('Results:');
    console.log(JSON.stringify(data, null, 2));
}

findStaff();
