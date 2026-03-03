const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
    const TABLES = [
        'subjects', 'teacher_subjects', 'teacher_classes', 'assignments',
        'curriculum', 'grade_levels', 'school_years', 'configurations', 'classrooms'
    ];

    const TERMS = ['Religioso', 'experimentais', 'Vida'];

    for (const table of TABLES) {
        console.log(`Checking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(100);

        if (error) {
            console.log(`- Could not read ${table}: ${error.message}`);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`- Table ${table} is empty.`);
            continue;
        }

        console.log(`- Scanning ${data.length} rows...`);
        data.forEach(row => {
            const rowStr = JSON.stringify(row).toLowerCase();
            for (const term of TERMS) {
                if (rowStr.includes(term.toLowerCase())) {
                    console.log(`!!! MATCH in ${table} for "${term}":`);
                    console.log(JSON.stringify(row, null, 2));
                }
            }
        });
    }
}

deepAudit();
