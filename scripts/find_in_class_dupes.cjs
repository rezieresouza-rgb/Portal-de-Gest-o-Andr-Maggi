const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findInClass() {
    const { data: classroom } = await supabase.from('classrooms').select('id').eq('name', '6º ANO A').single();
    
    const names = ['EMILY CRISTINA DO NASCIMENTO', 'ENZO ARTHUR DA SILVA SANTOS', 'GUSTAVO HENRIQUE DE PAULA DE LARA'];
    
    for (const name of names) {
        console.log(`\nChecking enrollments for: ${name}`);
        const { data: students } = await supabase.from('students').select(`
            id, registration_number, name,
            enrollments!inner (classroom_id)
        `).ilike('name', `%${name}%`).eq('enrollments.classroom_id', classroom.id);
        
        console.log(students);
    }
}

findInClass();
