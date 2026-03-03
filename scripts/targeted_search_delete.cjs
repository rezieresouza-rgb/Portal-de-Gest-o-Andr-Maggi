const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchAndDelete() {
    console.log('=== TARGETED SEARCH FOR FORBIDDEN SUBJECTS IN ATTENDANCE ===\n');

    // Step 1: Search directly with ilike - this will find records even beyond 1000 limit
    const terms = ['religioso', 'projeto de vida', 'práticas', 'praticas'];

    for (const term of terms) {
        console.log(`\nSearching class_attendance_records for: "${term}"...`);
        const { data, error, count } = await supabase
            .from('class_attendance_records')
            .select('id, subject, date, classroom_name, teacher_name', { count: 'exact' })
            .ilike('subject', `%${term}%`);

        if (error) {
            console.error(`  Error: ${error.message}`);
        } else {
            console.log(`  Found: ${count} records`);
            if (data && data.length > 0) {
                data.forEach(r => console.log(`  -> ID: ${r.id} | Date: ${r.date} | Class: ${r.classroom_name} | Subject: "${r.subject}"`));
            }
        }
    }

    // Step 2: Get total count of class_attendance_records (without 1000 limit)
    console.log('\n--- TOTAL COUNT CHECK ---');
    const { count: totalCount } = await supabase
        .from('class_attendance_records')
        .select('*', { count: 'exact', head: true });
    console.log(`Total records in class_attendance_records: ${totalCount}`);

    // Step 3: Get count of class_attendance_students (without 1000 limit)
    const { count: studCount } = await supabase
        .from('class_attendance_students')
        .select('*', { count: 'exact', head: true });
    console.log(`Total records in class_attendance_students: ${studCount}`);

    // Step 4: Check all subjects present in attendance records
    console.log('\n--- ALL UNIQUE SUBJECTS IN ATTENDANCE ---');
    const { data: allRecords } = await supabase
        .from('class_attendance_records')
        .select('subject')
        .order('subject');

    if (allRecords) {
        const unique = [...new Set(allRecords.map(r => r.subject))].sort();
        unique.forEach(s => console.log(`  - "${s}"`));
        console.log(`  Total unique subjects: ${unique.length}`);
    }
}

searchAndDelete().catch(console.error);
