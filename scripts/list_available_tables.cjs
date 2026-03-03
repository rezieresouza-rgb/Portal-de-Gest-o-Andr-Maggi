const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Attempting to list all tables in public schema...');

    // Using a trick: query a non-existent table and hope the error doesn't happen 
    // OR try to use information_schema if enabled for anon role
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        console.error('Error fetching from information_schema:', error.message);

        // Fallback: try to guess other common tables
        const COMMON_TABLES = [
            'subjects', 'teacher_subjects', 'teacher_classes', 'assignments',
            'curriculum', 'grade_levels', 'school_years', 'configurations',
            'settings', 'metadata', 'audit_logs', 'logs'
        ];

        for (const t of COMMON_TABLES) {
            const { count, error: te } = await supabase.from(t).select('*', { count: 'exact', head: true });
            if (!te) {
                console.log(`Table exists: ${t} (${count} rows)`);
            }
        }
    } else {
        console.log('Tables found in information_schema:');
        data.forEach(t => console.log(`- ${t.table_name}`));
    }
}

listAllTables();
