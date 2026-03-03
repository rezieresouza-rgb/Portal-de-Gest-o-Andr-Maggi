
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllTables() {
    console.log('--- Listing all accessible tables via postgrest RPC or guessing ---');
    // Supabase doesn't expose a direct way to list tables via JS client without an RPC,
    // but we can try to use the information_schema via a trick or just guess more common names.
    // Actually, let's try to query a non-existent table and see the error message, sometimes it lists valid ones? No.

    // Better: let's try to find where "Ensino Religioso" is used in the UI and what it fetches.
    // The user said "diário de presença".
    // SecretariatAttendanceHistory.tsx fetches from 'class_attendance_records'.
    // TeacherAttendance.tsx fetches from 'class_attendance_records'.
}

// Let's try to search ALL records in class_attendance_records for ANY text field that contains "Religioso"
async function searchAllValues() {
    console.log('Searching all values in class_attendance_records...');
    const { data, error } = await supabase.from('class_attendance_records').select('*');
    if (error) return console.error(error);

    const forbidden = ['ENSINO RELIGIOSO', 'PRÁTICAS EXPERIMENTAIS', 'PROJETO DE VIDA'];
    let foundCount = 0;

    data.forEach(row => {
        const rowStr = JSON.stringify(row).toUpperCase();
        forbidden.forEach(subject => {
            if (rowStr.includes(subject)) {
                console.log(`FOUND "${subject}" in row ID: ${row.id}`);
                console.log('Row data:', row);
                foundCount++;
            }
        });
    });
    console.log(`Search finished. Found ${foundCount} matches.`);
}

searchAllValues();
