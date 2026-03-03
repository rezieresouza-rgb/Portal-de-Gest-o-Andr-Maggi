const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBNCCSubjects() {
    console.log('Fetching unique subjects from "bncc_skills"...');

    const { data, error } = await supabase
        .from('bncc_skills')
        .select('subject');

    if (error) {
        console.error('Error fetching BNCC skills:', error.message);
        return;
    }

    const uniqueSubjects = Array.from(new Set(data.map(r => r.subject))).sort();

    console.log(`Found ${uniqueSubjects.length} unique subjects in BNCC skills:`);
    uniqueSubjects.forEach(s => console.log(` - ${s}`));

    const forbidden = uniqueSubjects.filter(s =>
        s.toUpperCase().includes('RELIGIOSO') ||
        s.toUpperCase().includes('VIDA') ||
        s.toUpperCase().includes('EXPERIMENTAIS')
    );

    if (forbidden.length > 0) {
        console.log('FORBIDDEN SUBJECTS FOUND IN BNCC SKILLS:');
        forbidden.forEach(s => console.log(` !!! ${s}`));
    } else {
        console.log('No forbidden subjects found in BNCC skills.');
    }
}

checkBNCCSubjects();
