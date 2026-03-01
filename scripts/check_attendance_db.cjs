require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: recs, error: e1 } = await supabase.from('class_attendance_records').select('*').limit(1);
    console.log('class_attendance_records columns:', recs && recs.length > 0 ? Object.keys(recs[0]) : 'no records');

    const { data: studs, error: e2 } = await supabase.from('class_attendance_students').select('*').limit(1);
    console.log('class_attendance_students columns:', studs && studs.length > 0 ? Object.keys(studs[0]) : 'no records');
}

check();
