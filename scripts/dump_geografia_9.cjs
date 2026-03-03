const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpGeografia9() {
    const { data, error } = await supabase
        .from('bncc_skills')
        .select('*')
        .ilike('subject', '%geografia%')
        .in('year_range', ['EF09', 'EF89', 'EF69'])
        .order('code');

    if (error) {
        console.error("Erro:", error);
        return;
    }

    console.log(`Encontradas ${data.length} habilidades.`);
    data.forEach(s => {
        console.log(`[${s.code}] (${s.year_range}) ${s.subject}: ${s.description.substring(0, 100)}...`);
    });
}

dumpGeografia9();
