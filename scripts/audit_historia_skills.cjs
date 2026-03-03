const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditHistoria() {
    const { data, error } = await supabase
        .from('bncc_skills')
        .select('code, subject, description')
        .eq('subject', 'HISTÓRIA');

    if (error) {
        console.error("Erro:", error);
        return;
    }

    const affected = data.filter(s => !s.description.includes('[Objeto de Conhecimento:'));

    console.log(`Auditoria de História:`);
    console.log(`Total de habilidades: ${data.length}`);
    console.log(`Habilidades sem objeto de conhecimento: ${affected.length}`);

    if (affected.length > 0) {
        console.log("\nExemplos de habilidades afetadas:");
        affected.slice(0, 10).forEach(s => console.log(`[${s.code}] ${s.description.substring(0, 80)}...`));
    }
}

auditHistoria();
