const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTypos() {
    const { data: allSkills, error } = await supabase
        .from('bncc_skills')
        .select('code, subject, description');

    if (error) {
        console.error("Erro:", error);
        return;
    }

    // Find codes that contain 'EFO' (Letter O)
    const typoSkills = allSkills.filter(s => s.code.includes('EFO'));

    console.log(`Encontradas ${typoSkills.length} habilidades com 'EFO' (Letra O):`);
    typoSkills.forEach(s => {
        console.log(`[${s.code}] ${s.subject}`);
    });
}

findTypos();
