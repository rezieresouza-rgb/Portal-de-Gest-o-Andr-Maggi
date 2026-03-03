const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    const { data: skills, error } = await supabase.from('bncc_skills').select('code, year_range, subject').ilike('subject', '%ARTE%');
    if (error) { console.error(error); return; }

    console.log('Found', skills.length, 'Artes skills');

    // As habilidades de Artes para o Ensino Fundamental Anos Finais são EF69AR...
    // Portanto, seu year_range correto no sistema é EF69.
    const wrongSkills = skills.filter(s => s.code.startsWith('EF69AR') && s.year_range !== 'EF69');

    console.log('Skills with wrong year range:', wrongSkills.map(s => s.code + ' (' + s.year_range + ')').join(', '));

    if (wrongSkills.length > 0) {
        const { data, error: updateError } = await supabase.from('bncc_skills')
            .update({ year_range: 'EF69' })
            .in('code', wrongSkills.map(s => s.code))
            .select();

        if (updateError) console.error('Update error:', updateError);
        else console.log('Successfully updated', data.length, 'skills to EF69');
    } else {
        console.log('No skills with incorrect year range found.');
    }
}
fix();
