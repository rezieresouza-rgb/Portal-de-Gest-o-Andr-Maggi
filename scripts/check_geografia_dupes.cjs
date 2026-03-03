const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    const { data, error } = await supabase
        .from('bncc_skills')
        .select('code, description')
        .eq('subject', 'GEOGRAFIA')
        .in('code', ['EF09GE01', 'EF09GE02', 'EF09GE03']);

    if (error) {
        console.error("Erro ao buscar:", error);
        return;
    }

    console.log("Habilidades atuais no banco:");
    data.forEach(s => console.log(`${s.code} -> ${s.description}`));
}

checkDuplicates();
