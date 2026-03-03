
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns() {
    const tables = ['lesson_plans', 'pei_records', 'class_attendance_records', 'assessments'];

    for (const table of tables) {
        console.log(`\n--- Colunas de: ${table} ---`);
        const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: table });

        // If RPC doesn't exist, try a direct query (if allowed) or just fetch one row
        if (error) {
            const { data: row, error: rowErr } = await supabase.from(table).select('*').limit(1);
            if (rowErr) {
                console.error(`Erro ao ler ${table}:`, rowErr);
            } else if (row && row.length > 0) {
                console.log(Object.keys(row[0]).join(', '));
            } else {
                console.log('Tabela vazia ou não encontrada.');
                // Try to get columns even if empty
                const { data: emptyData, error: emptyErr } = await supabase.from(table).select('*').limit(0);
                if (!emptyErr) {
                    // This might not show columns in some clients, but worth a try
                }
            }
        } else {
            console.log(data);
        }
    }
}

listColumns();
