
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAllUnique(table, column) {
    let allSubjects = new Set();
    let from = 0;
    const step = 1000;
    let hasMore = true;

    console.log(`Checking ${table}.${column}...`);

    while (hasMore) {
        const { data, error } = await supabase
            .from(table)
            .select(column)
            .range(from, from + step - 1);

        if (error) {
            console.error(`Error in ${table}:`, error.message);
            break;
        }

        if (data.length === 0) {
            hasMore = false;
        } else {
            data.forEach(r => {
                if (r[column]) allSubjects.add(r[column].toUpperCase().trim());
            });
            from += step;
            if (data.length < step) hasMore = false;
        }
    }
    return Array.from(allSubjects).sort();
}

async function run() {
    const tables = [
        { name: 'class_attendance_records', col: 'subject' },
        { name: 'lesson_plans', col: 'subject' },
        { name: 'assessments', col: 'subject' },
        { name: 'bncc_skills', col: 'subject' }
    ];

    for (const t of tables) {
        const unique = await getAllUnique(t.name, t.col);
        console.log(`Unique subjects in ${t.name}:`, unique.length);
        const forbidden = unique.filter(s =>
            s.includes('ENSINO RELIGIOSO') ||
            s.includes('PRÁTICAS EXPERIMENTAIS') ||
            s.includes('PROJETO DE VIDA') ||
            s.includes('PRATICAS EXPERIMENTAIS') // without accent
        );
        if (forbidden.length > 0) {
            console.log(`  !! FOUND FORBIDDEN SUBJECTS in ${t.name}:`);
            forbidden.forEach(f => console.log(`     - "${f}"`));
        } else {
            console.log(`  (Clean)`);
        }
    }

    // Also check lesson_plans content_json for text matches
    console.log('Searching lesson_plans.content_json for "Religioso"...');
    const { data: lpMatch } = await supabase
        .from('lesson_plans')
        .select('id, subject, content_json')
        .contains('content_json', { subject: 'ENSINO RELIGIOSO' }); // Try exact match in JSON if its a key

    // Check if it's just raw text in the JSON
    const { data: lpRaw } = await supabase
        .from('lesson_plans')
        .select('id, subject')
        .ilike('content_json::text', '%ENSINO RELIGIOSO%');

    if (lpMatch?.length > 0) console.log('Found matches in lpMatch:', lpMatch.length);
    if (lpRaw?.length > 0) console.log('Found matches in lpRaw:', lpRaw.length);
}

run();
