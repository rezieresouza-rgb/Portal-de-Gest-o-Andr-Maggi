const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStaff() {
    console.log('Fetching all records from "staff" table...');
    const { data, error } = await supabase
        .from('staff')
        .select('*');

    if (error) {
        console.error('Error fetching staff:', error.message);
        return;
    }

    console.log(`Found ${data.length} staff members.`);

    // Look for any field that might contain subjects
    data.forEach(s => {
        const values = Object.values(s).map(v => String(v).toUpperCase());
        const hasForbidden = values.some(v =>
            v.includes('RELIGIOSO') ||
            v.includes('VIDA') ||
            v.includes('EXPERIMENTAIS')
        );

        if (hasForbidden) {
            console.log('FORBIDDEN SUBJECT FOUND IN STAFF RECORD:');
            console.log(s);
        }
    });

    console.log('Staff check complete.');
}

checkStaff();
