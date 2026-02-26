const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllClassrooms() {
    const { data: classrooms, error } = await supabase
        .from('classrooms')
        .select('name')
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    fs.writeFileSync('scripts/db_classrooms.txt', classrooms.map(c => c.name).join('\n'), 'utf8');
}

listAllClassrooms();
