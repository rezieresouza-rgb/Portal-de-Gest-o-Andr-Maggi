const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        // If information_schema is restricted, try a different approach or just list what we can
        console.log('Error querying information_schema:', error.message);

        // Try to list tables by querying a non-existent table and checking the error message? 
        // No, let's try to just select from some common names.
        const commonTables = [
            'students', 'enrollments', 'classrooms', 'class_attendance_records',
            'class_attendance_students', 'lesson_plans', 'staff', 'subjects',
            'bncc_skills', 'student_movements', 'users', 'profiles'
        ];

        console.log('Testing common tables...');
        for (const table of commonTables) {
            const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (!tableError) {
                console.log(`Table exists: ${table}`);
            } else {
                console.log(`Table error (${table}): ${tableError.message}`);
            }
        }
    } else {
        console.log('Tables found via information_schema:');
        data.forEach(t => console.log(t.table_name));
    }
}

listTables();
