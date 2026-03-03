
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUniqueSubjects() {
    try {
        console.log('--- Unique Subjects in class_attendance_records ---');
        const { data: records, error } = await supabase
            .from('class_attendance_records')
            .select('subject');

        if (error) {
            console.error('Error fetching attendance records:', error);
        } else {
            const uniqueSubjects = [...new Set(records.map(r => r.subject))].sort();
            console.log('Total unique subjects found:', uniqueSubjects.length);
            uniqueSubjects.forEach(s => console.log(`- "${s}"`));
        }

        console.log('\n--- Unique Subjects in lesson_plans ---');
        const { data: plans, error: planError } = await supabase
            .from('lesson_plans')
            .select('subject');

        if (planError) {
            console.error('Error fetching lesson plans:', planError);
        } else {
            const uniquePlans = [...new Set(plans.map(p => p.subject))].sort();
            console.log('Total unique subjects in lesson_plans found:', uniquePlans.length);
            uniquePlans.forEach(c => console.log(`- "${c}"`));
        }

        console.log('\n--- Unique Subjects in pei_records ---');
        const { data: pei, error: peiError } = await supabase
            .from('pei_records')
            .select('subject');

        if (peiError) {
            console.log('Table pei_records not found or error:', peiError.message);
        } else {
            const uniquePei = [...new Set(pei.map(p => p.subject))].sort();
            console.log('Total unique subjects in pei_records found:', uniquePei.length);
            uniquePei.forEach(s => console.log(`- "${s}"`));
        }

        console.log('\n--- Unique Subjects in Assessments ---');
        const { data: assessments, error: assError } = await supabase
            .from('assessments')
            .select('subject');

        if (assError) {
            console.error('Error fetching assessments:', assError);
        } else {
            const uniqueAssessments = [...new Set(assessments.map(a => a.subject))].sort();
            console.log('Total unique subjects in assessments found:', uniqueAssessments.length);
            uniqueAssessments.forEach(s => console.log(`- "${s}"`));
        }

        console.log('\n--- Searching specifically for suspicious keywords in ALL fetched subjects ---');
        // I can track all here if needed.
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

listUniqueSubjects();
