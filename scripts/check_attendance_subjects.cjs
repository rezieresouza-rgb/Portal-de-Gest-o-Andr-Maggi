const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAttendanceSubjects() {
    console.log('Fetching unique subjects from "class_attendance_records"...');

    // Fetch all records - there are only ~107
    const { data, error } = await supabase
        .from('class_attendance_records')
        .select('subject');

    if (error) {
        console.error('Error fetching attendance records:', error.message);
        return;
    }

    const uniqueSubjects = Array.from(new Set(data.map(r => r.subject))).sort();

    console.log(`Found ${uniqueSubjects.length} unique subjects:`);
    uniqueSubjects.forEach(s => console.log(` - ${s}`));

    const forbidden = uniqueSubjects.filter(s =>
        s.toUpperCase().includes('RELIGIOSO') ||
        s.toUpperCase().includes('VIDA') ||
        s.toUpperCase().includes('EXPERIMENTAIS')
    );

    if (forbidden.length > 0) {
        console.log('FORBIDDEN SUBJECTS FOUND IN ATTENDANCE RECORDS:');
        forbidden.forEach(s => console.log(` !!! ${s}`));
    } else {
        console.log('No forbidden subjects found in attendance records.');
    }
}

checkAttendanceSubjects();
