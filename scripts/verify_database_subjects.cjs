
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verificando "Ensino Religioso" em todas as tabelas relevantes...');

    const subjects = ['ENSINO RELIGIOSO', 'PRÁTICAS EXPERIMENTAIS', 'PROJETO DE VIDA'];

    for (const s of subjects) {
        console.log(`\n--- Buscando por: ${s} ---`);

        // Check Attendance Records
        const { data: attendance, error: attErr } = await supabase
            .from('class_attendance_records')
            .select('*')
            .ilike('subject', `%${s}%`);

        if (attErr) console.error('Erro em class_attendance_records:', attErr);
        else console.log(`Encontrados em class_attendance_records: ${attendance.length}`);

        // Check Assessments
        const { data: assessments, error: assErr } = await supabase
            .from('assessments')
            .select('*')
            .ilike('subject', `%${s}%`);

        if (assErr) console.error('Erro em assessments:', assErr);
        else console.log(`Encontrados em assessments: ${assessments.length}`);

        // Check Lesson Plans
        const { data: lessonPlans, error: lpErr } = await supabase
            .from('lesson_plans')
            .select('*')
            .ilike('curricular_component', `%${s}%`);

        if (lpErr) console.error('Erro em lesson_plans:', lpErr);
        else console.log(`Encontrados em lesson_plans: ${lessonPlans.length}`);

        // Check PEI Records (Special Education)
        const { data: specialEd, error: seErr } = await supabase
            .from('pei_records')
            .select('*')
            .ilike('subject', `%${s}%`);

        if (seErr) console.error('Erro em pei_records:', seErr);
        else console.log(`Encontrados em pei_records: ${specialEd.length}`);
    }
}

verify();
