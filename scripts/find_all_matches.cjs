const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllMatches() {
    const codes = ['EF09GE01', 'EF09GE02', 'EF09GE03'];
    const { data, error } = await supabase
        .from('bncc_skills')
        .select('code, subject, year_range, description')
        .in('code', codes);

    if (error) {
        console.error("Erro ao buscar:", error);
        return;
    }

    console.log(`Total de registros encontrados para os códigos ${codes.join(', ')}: ${data.length}`);
    data.forEach(item => {
        console.log(`Code: ${item.code} | Subject: ${item.subject} | Year Range: ${item.year_range}`);
    });
}

findAllMatches();
