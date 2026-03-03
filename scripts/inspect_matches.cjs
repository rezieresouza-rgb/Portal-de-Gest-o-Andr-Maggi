const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectMatches() {
    console.log('Inspecting staff table for "Vida" in status...');
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .ilike('status', '%Vida%');

    if (staffError) console.error(staffError);
    else {
        console.log('Matches in staff.status:');
        staff.forEach(s => console.log(`- ID: ${s.id}, Name: ${s.name}, Status: ${s.status}`));
    }

    console.log('\nInspecting lesson_plans for "Vida" in themes...');
    const { data: lp, error: lpError } = await supabase
        .from('lesson_plans')
        .select('*')
        .ilike('themes', '%Vida%');

    if (lpError) console.error(lpError);
    else {
        console.log('Matches in lesson_plans.themes:');
        lp.forEach(l => console.log(`- ID: ${l.id}, Subject: ${l.subject}, Themes: ${l.themes}`));
    }

    // Also check subjects table for all terms
    const TERMS = ['Religioso', 'experimentais', 'Vida'];
    for (const term of TERMS) {
        console.log(`\nSearching subjects table for "${term}"...`);
        const { data: subjs, error: subError } = await supabase
            .from('subjects')
            .select('*');

        if (subError) {
            console.error('Error reading subjects table:', subError.message);
        } else if (subjs) {
            const matches = subjs.filter(s => JSON.stringify(s).toLowerCase().includes(term.toLowerCase()));
            if (matches.length > 0) {
                console.log(`Matches in subjects for "${term}":`);
                matches.forEach(m => console.log(`- ${JSON.stringify(m)}`));
            } else {
                console.log(`No matches for "${term}" in subjects.`);
            }
        }
    }
}

inspectMatches();
