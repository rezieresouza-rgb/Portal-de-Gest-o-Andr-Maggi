const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBncc() {
    console.log('Inspecting bncc_skills for forbidden terms...');
    const TERMS = ['Religioso', 'experimentais', 'Vida'];

    for (const term of TERMS) {
        console.log(`\n--- Term: ${term} ---`);
        const { data, error } = await supabase
            .from('bncc_skills')
            .select('code, subject, description, year_range')
            .ilike('description', `%${term}%`);

        if (error) {
            console.error(error);
        } else {
            data.forEach(d => {
                // filter false positives for "Vida" if they contain "atividade"
                if (term === 'Vida' && d.description.toLowerCase().includes('atividade')) {
                    // console.log(`[Skipping false positive: ${d.code}]`);
                    return;
                }
                console.log(`Code: ${d.code}, Subject: ${d.subject}, Year: ${d.year_range}`);
                console.log(`Description: ${d.description.substring(0, 100)}...`);
            });
        }
    }
}

inspectBncc();
