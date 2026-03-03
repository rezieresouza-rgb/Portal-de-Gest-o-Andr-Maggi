const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicates() {
    // Find codes that appear more than once for the same subject
    const { data, error } = await supabase
        .from('bncc_skills')
        .select('code, subject, year_range')
        .eq('subject', 'GEOGRAFIA')
        .ilike('code', 'EF09GE%');

    if (error) {
        console.error("Erro ao buscar:", error);
        return;
    }

    const countMap = {};
    data.forEach(item => {
        countMap[item.code] = (countMap[item.code] || 0) + 1;
    });

    console.log("Habilidades com múltiplas entradas:");
    Object.keys(countMap).filter(code => countMap[code] > 1).forEach(code => {
        const matches = data.filter(d => d.code === code);
        console.log(`${code}: ${matches.length} entries`);
        matches.forEach(m => console.log(`  - Subject: ${m.subject}, Year Range: ${m.year_range}`));
    });

    if (Object.keys(countMap).filter(code => countMap[code] > 1).length === 0) {
        console.log("Nenhuma duplicata óbvia encontrada para GEOGRAFIA 9º Ano.");
    }
}

findDuplicates();
