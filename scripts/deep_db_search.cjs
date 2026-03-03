
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deepSearch() {
    const keywords = ['%RELIGIO%', '%PRATICA%', '%PROJETO%', '%VIDA%'];
    const tables = [
        { name: 'class_attendance_records', col: 'subject' },
        { name: 'lesson_plans', col: 'subject' },
        { name: 'assessments', col: 'subject' },
        { name: 'pei_records', col: 'subject' }, // Might fail if col name is diff
        { name: 'pei_records', col: 'content_json' }, // Check JSON too
    ];

    console.log('--- Deep Database Search ---');

    for (const table of tables) {
        for (const kw of keywords) {
            try {
                let query = supabase.from(table.name).select('*', { count: 'exact' });

                if (table.col === 'content_json') {
                    // Basic search in JSON string might be tricky, let's just use .or and hope
                    // Actually, let's skip JSON for now unless we suspect it.
                    continue;
                } else {
                    query = query.ilike(table.col, kw);
                }

                const { data, count, error } = await query;
                if (error) {
                    if (error.code === '42703') {
                        // Column not found, ignore
                    } else {
                        console.error(`Error in ${table.name}.${table.col}:`, error.message);
                    }
                    continue;
                }

                if (count > 0) {
                    console.log(`FOUND ${count} records in ${table.name} matching ${kw}`);
                    // List first 3
                    data.slice(0, 3).forEach(r => console.log(`  - ID: ${r.id}, "${r[table.col]}"`));
                }
            } catch (err) {
                // console.error(err);
            }
        }
    }
}

deepSearch();
