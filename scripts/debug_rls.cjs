
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const lines = envContent.split('\n');
    for (let line of lines) {
        if (line.trim().startsWith(name + '=')) {
            return line.split('=')[1].trim();
        }
    }
    return null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifiedInsert() {
    console.log('Testando inserção verificada...');
    const { data, error } = await supabase
        .from('bncc_skills')
        .insert([{ code: 'TEST_AUTH', description: 'Testing auth and RLS', subject: 'TEST', year_range: 'EF00' }])
        .select();

    if (error) {
        console.error('ERRO NA INSERÇÃO:', error.message);
        if (error.hint) console.error('DICA:', error.hint);
    } else {
        console.log('INSERIDO COM SUCESSO:', data);
    }

    const { data: all, error: errAll } = await supabase.from('bncc_skills').select('*').limit(1);
    console.log('Consulta geral:', all ? all.length : 0, 'itens');
}

verifiedInsert();
