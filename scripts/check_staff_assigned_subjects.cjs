const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FORBIDDEN = ['ENSINO RELIGIOSO', 'PROJETO DE VIDA', 'PRÁTICAS EXPERIMENTAIS', 'PRATICAS EXPERIMENTAIS'];

async function checkAllStaffSubjects() {
    console.log('=== CHECKING STAFF assigned_subjects FOR FORBIDDEN SUBJECTS ===\n');

    const { data, error } = await supabase
        .from('staff')
        .select('id, name, assigned_subjects');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Total staff: ${data.length}\n`);

    let found = 0;
    data.forEach(staff => {
        if (!staff.assigned_subjects) return;
        const subjects = Array.isArray(staff.assigned_subjects) ? staff.assigned_subjects : [staff.assigned_subjects];
        subjects.forEach(sub => {
            const upper = String(sub).toUpperCase();
            const isForbidden = FORBIDDEN.some(f => upper.includes(f));
            if (isForbidden) {
                console.log(`!!! FORBIDDEN: Staff "${staff.name}" has subject: "${sub}"`);
                found++;
            } else {
                console.log(`  OK: "${staff.name}" -> "${sub}"`);
            }
        });
    });

    if (found === 0) console.log('No forbidden subjects found in staff.assigned_subjects');

    // Also check the users table for subject-related fields
    console.log('\n=== CHECKING users TABLE ===\n');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

    if (usersError) {
        console.error('Users error:', usersError.message);
        return;
    }

    let usersFound = 0;
    users.forEach(user => {
        Object.entries(user).forEach(([key, val]) => {
            if (!val) return;
            const str = String(val).toUpperCase();
            if (FORBIDDEN.some(f => str.includes(f))) {
                console.log(`!!! FORBIDDEN in users: ID=${user.id} Field=${key} Value="${val}"`);
                usersFound++;
            }
        });
    });

    if (usersFound === 0) console.log('No forbidden subjects found in users table');
}

checkAllStaffSubjects().catch(console.error);
