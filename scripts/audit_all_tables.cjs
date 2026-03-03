const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    const TABLES = [
        'class_attendance_records',
        'lesson_plans',
        'pei_records',
        'assessments',
        'classrooms',
        'users',
        'staff',
        'students',
        'subjects',
        'enrollments',
        'bncc_skills',
        'teacher_subjects',
        'teacher_classes',
        'assignments',
        'curriculum',
        'grade_levels',
        'school_years',
        'configurations'
    ];

    const SEARCH_TERMS = ['Religioso', 'experimentais', 'Vida'];

    for (const table of TABLES) {
        console.log(`Auditing table: ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1); // Just check if it has data

        if (error) {
            console.error(`Error reading ${table}:`, error.message);
            continue;
        }

        // Fetch all headers (columns)
        const { data: firstRow } = await supabase.from(table).select('*').limit(1).single();
        if (firstRow) {
            const columns = Object.keys(firstRow);
            for (const col of columns) {
                for (const term of SEARCH_TERMS) {
                    const { count, error: searchError } = await supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true })
                        .ilike(col, `%${term}%`);

                    if (!searchError && count > 0) {
                        console.log(`!!! MATCH FOUND in ${table}.${col} for "${term}": ${count} rows`);
                    }
                }
            }
        } else {
            console.log(`Table ${table} is empty or not accessible.`);
        }
    }
    console.log('--- Audit Finished ---');
}

runSql();
