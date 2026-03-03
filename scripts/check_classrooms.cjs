
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClassrooms() {
    console.log('--- Checking classrooms ---');
    const { data, error } = await supabase.from('classrooms').select('name');
    if (error) return console.error(error);

    data.forEach(c => console.log(`- "${c.name}"`));
}

checkClassrooms();
