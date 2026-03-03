const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function paginatedAuditAndClean() {
    console.log('=== PAGINATED AUDIT OF class_attendance_records ===\n');

    // Get total count
    const { count: total } = await supabase
        .from('class_attendance_records')
        .select('*', { count: 'exact', head: true });

    console.log(`Total records: ${total}`);

    const PAGE_SIZE = 1000;
    const pages = Math.ceil(total / PAGE_SIZE);
    const forbiddenTerms = ['religioso', 'projeto de vida', 'práticas', 'praticas experimentais'];

    let allForbidden = [];

    for (let page = 0; page < pages; page++) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from('class_attendance_records')
            .select('id, subject, date, classroom_name')
            .range(from, to);

        if (error) {
            console.error(`Page ${page + 1} error: ${error.message}`);
            continue;
        }

        const found = data.filter(r => {
            const subjectUpper = (r.subject || '').toUpperCase();
            return forbiddenTerms.some(t => subjectUpper.includes(t.toUpperCase()));
        });

        if (found.length > 0) {
            console.log(`Page ${page + 1}: Found ${found.length} forbidden records!`);
            found.forEach(r => console.log(`  -> ID: ${r.id} | Date: ${r.date} | Subject: "${r.subject}"`));
            allForbidden.push(...found);
        } else {
            console.log(`Page ${page + 1} (records ${from}-${to}): Clean`);
        }
    }

    console.log(`\nTotal forbidden records found: ${allForbidden.length}`);

    if (allForbidden.length > 0) {
        console.log('\nDeleting forbidden records...');
        const ids = allForbidden.map(r => r.id);

        // First delete child records
        const { error: childErr } = await supabase
            .from('class_attendance_students')
            .delete()
            .in('attendance_record_id', ids);

        if (childErr) {
            console.error('Error deleting child records:', childErr.message);
        } else {
            console.log(`Deleted child attendance_student records.`);
        }

        // Then delete parent records
        const { error: parentErr } = await supabase
            .from('class_attendance_records')
            .delete()
            .in('id', ids);

        if (parentErr) {
            console.error('Error deleting parent records:', parentErr.message);
        } else {
            console.log(`Deleted ${ids.length} forbidden attendance records.`);
        }
    }
}

paginatedAuditAndClean().catch(console.error);
