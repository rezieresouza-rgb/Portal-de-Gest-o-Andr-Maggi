const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FORBIDDEN_TERMS = ['religioso', 'projeto de vida', 'práticas experimentais', 'praticas experimentais'];

async function checkAssessmentsTable() {
    console.log('=== CHECKING assessments TABLE ===\n');

    const { data, error, count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error (table may not exist):', error.message);
    } else {
        console.log(`Total assessments: ${count}`);
        const found = (data || []).filter(r => {
            return Object.values(r).some(v => {
                const str = String(v || '').toUpperCase();
                return FORBIDDEN_TERMS.some(f => str.includes(f.toUpperCase()));
            });
        });
        if (found.length > 0) {
            console.log('FORBIDDEN FOUND:', found);
        } else {
            console.log('Clean.');
        }

        // Print unique subjects in assessments
        if (data && data.length > 0) {
            const subjects = [...new Set(data.map(r => r.subject))].sort();
            console.log('\nUnique subjects in assessments:', subjects);
        }
    }

    // Also check the schedule table
    console.log('\n=== CHECKING class_schedules TABLE ===\n');
    const { data: sched, error: schedErr } = await supabase
        .from('class_schedules')
        .select('subject');

    if (schedErr) {
        console.error('Error:', schedErr.message);
    } else {
        const uniqueScheds = [...new Set((sched || []).map(r => r.subject))].sort();
        console.log('Unique subjects in class_schedules:', uniqueScheds);
        const forbidden = uniqueScheds.filter(s => FORBIDDEN_TERMS.some(f => String(s).toUpperCase().includes(f.toUpperCase())));
        if (forbidden.length > 0) {
            console.log('!!! FORBIDDEN IN class_schedules:', forbidden);
        }
    }
}

checkAssessmentsTable().catch(console.error);
