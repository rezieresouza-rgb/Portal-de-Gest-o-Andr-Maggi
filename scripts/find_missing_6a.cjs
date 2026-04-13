const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const missing = [
    { name: 'EMILY CRISTINA DO NASCIMENTO', reg: '2668931' },
    { name: 'ENZO ARTHUR DA SILVA SANTOS', reg: '2668902' },
    { name: 'GUSTAVO HENRIQUE DE PAULA DE LARA', reg: '2286436' }
];

async function findMissing() {
    for (const m of missing) {
        console.log(`Searching for: ${m.name}`);
        const parts = m.name.split(' ');
        const query = `%${parts[0]}%${parts[parts.length-1]}%`;
        const { data, error } = await supabase
            .from('students')
            .select('registration_number, name')
            .ilike('name', query);
        
        if (error) {
            console.error(`Error searching for ${m.name}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Found matches in DB:`, data);
        } else {
            console.log(`No matches found for ${m.name} using query ${query}`);
        }
    }
}

findMissing();
