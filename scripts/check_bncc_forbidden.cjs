const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBnccSubjects() {
    console.log('Checking bncc_skills for forbidden subjects in the "subject" column...');
    const FORBIDDEN = ['ENSINO RELIGIOSO', 'PRÁTICAS EXPERIMENTAIS', 'PROJETO DE VIDA'];

    for (const subj of FORBIDDEN) {
        const { data, error, count } = await supabase
            .from('bncc_skills')
            .select('*', { count: 'exact', head: true })
            .eq('subject', subj);

        if (error) {
            console.error(`Error checking ${subj}:`, error.message);
        } else {
            console.log(`${subj}: ${count} rows`);
            if (count > 0) {
                // Get a sample
                const { data: sample } = await supabase.from('bncc_skills').select('code, description').eq('subject', subj).limit(1);
                console.log(`Sample: ${sample[0].code} - ${sample[0].description.substring(0, 50)}...`);
            }
        }
    }
}

checkBnccSubjects();
