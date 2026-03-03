const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Listing all tables in public schema...');

    const { data: tables, error } = await supabase.rpc('list_all_tables');

    if (error) {
        console.log('Error calling list_all_tables RPC:', error.message);
        console.log('Trying direct query on information_schema...');

        // This usually requires more permissions, but let's try
        const { data: schemaTables, error: schemaError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (schemaError) {
            console.error('Error querying information_schema:', schemaError.message);

            // Try another way: just guess common names or use a known table to see if we can get others
            console.log('Querying a known table to check connection...');
            const { data: testData, error: testError } = await supabase.from('classrooms').select('name').limit(1);
            if (testError) {
                console.error('Connection test failed:', testError.message);
            } else {
                console.log('Connection OK. Tables found so far: lesson_plans, assessments, class_attendance_records, bncc_skills, pei_records, classrooms, students, teachers, configurations');
            }
        } else {
            console.log('Tables found via information_schema:', schemaTables.map(t => t.table_name));
        }
    } else {
        console.log('Tables found via RPC:', tables);
    }
}

listAllTables();
