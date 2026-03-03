
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function manualAudit() {
    const tables = ['class_attendance_records', 'lesson_plans'];
    const terms = ['Religioso', 'Experimentais', 'Vida'];

    for (const table of tables) {
        console.log(`Manual audit of table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1000);

        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`Table ${table} is empty.`);
            continue;
        }

        let found = false;
        data.forEach(row => {
            const rowStr = JSON.stringify(row);
            terms.forEach(term => {
                if (rowStr.toLowerCase().includes(term.toLowerCase())) {
                    // Filter out "ATIVIDADE" for "Vida"
                    if (term === 'Vida' && rowStr.toUpperCase().includes('ATIVIDADE') && !rowStr.toUpperCase().includes('PROJETO DE VIDA')) {
                        return;
                    }
                    console.log(`[FOUND] ${table} ID: ${row.id || 'N/A'}, Term: ${term}`);
                    console.log('Row snippet:', rowStr.substring(0, 500));
                    found = true;
                }
            });
        });
        if (!found) console.log(`No (real) matches in first 1000 rows of ${table}.`);
    }
}

manualAudit();
