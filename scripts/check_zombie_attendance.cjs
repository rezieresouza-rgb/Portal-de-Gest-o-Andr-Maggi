const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_SUBJECTS = [
    'MATEMÁTICA', 'CIÊNCIAS', 'GEOGRAFIA', 'HISTÓRIA',
    'LÍNGUA PORTUGUESA', 'LÍNGUA INGLESA', 'ARTE', 'EDUCAÇÃO FÍSICA'
];

async function checkZombieAttendance() {
    console.log('Checking class_attendance_records for non-allowed subjects...');
    const { data, error } = await supabase
        .from('class_attendance_records')
        .select('subject, classroom_name, teacher_name, date');

    if (error) {
        console.error(error);
        return;
    }

    const uniqueSubjects = [...new Set(data.map(r => r.subject))];
    console.log('Unique subjects found in attendance records:', uniqueSubjects);

    const zombies = data.filter(r => !ALLOWED_SUBJECTS.includes(r.subject?.toUpperCase()));
    if (zombies.length > 0) {
        console.log(`\n!!! FOUND ${zombies.length} ZOMBIE RECORDS:`);
        // Group by subject to avoid too much output
        const stats = {};
        zombies.forEach(z => {
            stats[z.subject] = (stats[z.subject] || 0) + 1;
        });
        console.log(stats);

        console.log('\nSample zombie:');
        console.log(zombies[0]);
    } else {
        console.log('No zombie attendance records found.');
    }
}

checkZombieAttendance();
