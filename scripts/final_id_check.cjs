
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ID = 'e8c4608c-9a49-445a-939e-2dc37667d4ce';

async function check() {
  try {
    const { data: rooms } = await supabase.from('classrooms').select('id, name').eq('id', TARGET_ID);
    console.log(`Checking TARGET_ID: ${TARGET_ID}`);
    console.log('Room found with this ID:', rooms);

    const { data: rawEnrolls } = await supabase.from('enrollments').select('classroom_id').eq('classroom_id', TARGET_ID);
    console.log(`Enrollments found for this ID in DB: ${rawEnrolls ? rawEnrolls.length : 'NULL'}`);

    const { data: allEnrolls } = await supabase.from('enrollments').select('classroom_id');
    const ids = allEnrolls.map(e => e.classroom_id);
    const uniqueIds = [...new Set(ids)];
    console.log('Unique classroom_ids in enrollments table:', uniqueIds);
    
    if (uniqueIds.includes(TARGET_ID)) {
        console.log('TARGET_ID IS PRESENT in enrollments table!');
    } else {
        console.log('TARGET_ID NOT FOUND in enrollments table.');
        // List similar IDs
        const similar = uniqueIds.filter(id => id.startsWith(TARGET_ID.substring(0, 4)));
        console.log('Similar IDs found:', similar);
    }

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
