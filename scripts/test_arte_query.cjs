const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const subject = 'ARTE';
    const className = '6º ANO A'; // simulated from typical TeacherLessonPlan

    const ranges = [];
    const isArte = subject.toUpperCase().includes('ARTE');

    if (className.includes('6º ANO')) {
        ranges.push(isArte ? 'EF69' : 'EF06', 'EF67', 'EF69');
    } else if (className.includes('7º ANO')) {
        ranges.push(isArte ? 'EF69' : 'EF07', 'EF67', 'EF69');
    } else if (className.includes('8º ANO')) {
        ranges.push(isArte ? 'EF69' : 'EF08', 'EF89', 'EF69');
    } else if (className.includes('9º ANO')) {
        ranges.push(isArte ? 'EF69' : 'EF09', 'EF89', 'EF69');
    }

    const uniqueRanges = [...new Set(ranges)];
    console.log('Testing subject:', subject, 'class:', className);
    console.log('Ranges:', uniqueRanges);

    const { data, error } = await supabase
        .from('bncc_skills')
        .select('code, description')
        .ilike('subject', `%${subject}%`)
        .in('year_range', uniqueRanges)
        .order('code');

    console.log('Result length:', data ? data.length : 0);
    if (error) console.error(error);
}
check();
