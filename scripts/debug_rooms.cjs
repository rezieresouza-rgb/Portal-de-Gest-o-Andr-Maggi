
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

async function check() {
  try {
    const { data, error } = await supabase.from('enrollments').select('classroom_id').limit(10);
    if (error) throw error;
    console.log('Sample enrollments classroom IDs:', data.map(e => e.classroom_id));

    const { data: rooms, error: errRooms } = await supabase.from('classrooms').select('id, name');
    if (errRooms) throw errRooms;
    console.log('Available classrooms:', rooms);
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
