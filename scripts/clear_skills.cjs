const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
    console.log("Deletando todas as habilidades de LÍNGUA PORTUGUESA cadastradas...");

    // As we can't easily drop all without knowing IDs or doing a true truncate via REST with RLS, 
    // we fetch them first then delete by ID, or we use a wide match if delete() allows it without eq.
    // Supabase JS allows delete with filters:
    const { data, error } = await supabase
        .from('bncc_skills')
        .delete()
        .eq('subject', 'LÍNGUA PORTUGUESA');

    if (error) {
        console.error("Erro ao deletar:", error.message);
    } else {
        console.log("Habilidades deletadas com sucesso. A tabela está limpa para recomeçar.");
    }
}

clearDatabase();
