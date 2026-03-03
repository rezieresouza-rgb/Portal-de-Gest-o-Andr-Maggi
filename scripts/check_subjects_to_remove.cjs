const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubjects() {
    const subjects = ['ENSINO RELIGIOSO', 'PRÁTICAS EXPERIMENTAIS', 'PROJETO DE VIDA'];

    for (const subject of subjects) {
        const { count, error } = await supabase
            .from('bncc_skills')
            .select('*', { count: 'exact', head: true })
            .ilike('subject', `%${subject}%`);

        if (error) {
            console.error(`Erro ao checar ${subject}:`, error);
        } else {
            console.log(`${subject}: ${count} habilidades encontradas.`);
        }
    }
}

checkSubjects();
