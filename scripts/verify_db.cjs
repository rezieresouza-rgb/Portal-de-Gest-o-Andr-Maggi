
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const portalPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi');
const envPath = path.join(portalPath, '.env.local');
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

async function verify() {
    const { data: countData, error: countError } = await supabase
        .from('bncc_skills')
        .select('count', { count: 'exact' });

    if (countError) {
        console.error('Erro ao contar:', countError.message);
    } else {
        console.log(`Total de habilidades no banco: ${countData[0]?.count || 0}`);
    }

    const { data: ptSkills, error: ptError } = await supabase
        .from('bncc_skills')
        .select('code, description')
        .eq('subject', 'LÍNGUA PORTUGUESA')
        .limit(5);

    if (ptError) {
        console.error('Erro ao buscar Português:', ptError.message);
    } else {
        console.log('Amostra de Português:', ptSkills.length, 'itens encontrados.');
        ptSkills.forEach(s => console.log(`- ${s.code}: ${s.description.substring(0, 50)}...`));
    }
}

verify();
