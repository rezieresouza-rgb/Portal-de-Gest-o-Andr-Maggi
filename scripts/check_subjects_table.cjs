const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSubjects() {
    console.log('Fetching all records from "subjects" table...');
    const { data, error } = await supabase
        .from('subjects')
        .select('*');

    if (error) {
        console.error('Error fetching subjects:', error.message);
        return;
    }

    console.log(`Found ${data.length} subjects:`);
    console.table(data);

    const forbidden = data.filter(s =>
        s.name.includes('Ensino Religioso') ||
        s.name.includes('Projeto de Vida') ||
        s.name.includes('Práticas experimentais')
    );

    if (forbidden.length > 0) {
        console.log('FORBIDDEN SUBJECTS FOUND IN "subjects" TABLE:');
        console.table(forbidden);
    } else {
        console.log('No forbidden subjects found in "subjects" table.');
    }
}

checkSubjects();
