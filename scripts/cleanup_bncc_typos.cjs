const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const typoCodes = [
    'EFO9GE01', 'EFO9GE02', 'EFO9GE03',
    'EFO9HI19', 'EFO9H123', 'EFO8HI11', 'EFO9HI10', 'EFO9HI12', 'EFO9HI14', 'EFO9HI17'
];

async function cleanupTypos() {
    console.log(`Iniciando limpeza de ${typoCodes.length} registros com erro (EFO)...`);

    const { data, error } = await supabase
        .from('bncc_skills')
        .delete()
        .in('code', typoCodes)
        .select();

    if (error) {
        console.error("Erro ao deletar:", error);
    } else {
        console.log(`Sucesso! ${data ? data.length : 0} registros deletados.`);
        if (data) {
            data.forEach(s => console.log(`- Deletado: ${s.code} (${s.subject})`));
        }
    }
}

cleanupTypos();
