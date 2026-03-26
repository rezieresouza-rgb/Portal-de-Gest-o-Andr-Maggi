
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
    const { data: rooms, error: errRooms } = await supabase.from('classrooms').select('id, name');
    console.log('Available classrooms:', rooms);

    const { data: enrolls, error: errEnrolls } = await supabase.from('enrollments').select('classroom_id, count').limit(10);
    // counts grouped by class
    const { data: counts, error: errCounts } = await supabase.rpc('get_enrollment_counts'); 
    // If RPC not available, let's just count manually
    const { data: rawEnrolls, error: errRaw } = await supabase.from('enrollments').select('classroom_id');
    const grouped = rawEnrolls.reduce((acc, curr) => {
        acc[curr.classroom_id] = (acc[curr.classroom_id] || 0) + 1;
        return acc;
    }, {});
    console.log('Enrollment counts per classroom_id:', grouped);

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

check();
