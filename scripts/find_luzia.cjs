const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchLuzia() {
    console.log("Searching for Luzia in 'users'...");
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Luzia%');

    if (userError) {
        console.error("Error searching users:", userError);
    } else {
        console.log("Users found:", JSON.stringify(users, null, 2));
    }

    console.log("Searching for Luzia in 'staff'...");
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .ilike('name', '%Luzia%');

    if (staffError) {
        console.error("Error searching staff:", staffError);
    } else {
        console.log("Staff found:", JSON.stringify(staff, null, 2));
    }
}

searchLuzia();
