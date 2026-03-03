const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLessonPlanSubjects() {
    console.log('Fetching unique subjects from "lesson_plans"...');

    const { data, error } = await supabase
        .from('lesson_plans')
        .select('subject');

    if (error) {
        console.error('Error fetching lesson plans:', error.message);
        return;
    }

    const uniqueSubjects = Array.from(new Set(data.map(r => r.subject))).sort();

    console.log(`Found ${uniqueSubjects.length} unique subjects in lesson plans:`);
    uniqueSubjects.forEach(s => console.log(` - ${s}`));

    const forbidden = uniqueSubjects.filter(s =>
        s.toUpperCase().includes('RELIGIOSO') ||
        s.toUpperCase().includes('VIDA') ||
        s.toUpperCase().includes('EXPERIMENTAIS')
    );

    if (forbidden.length > 0) {
        console.log('FORBIDDEN SUBJECTS FOUND IN LESSON PLANS:');
        forbidden.forEach(s => console.log(` !!! ${s}`));
    } else {
        console.log('No forbidden subjects found in lesson plans.');
    }
}

checkLessonPlanSubjects();
