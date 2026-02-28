const fs = require('fs');
const path = require('path');

const portalPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi');
const envPath = path.join(portalPath, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVar = (name) => {
    const line = envContent.split('\n').find(l => l.startsWith(name + '='));
    return line ? line.split('=')[1].trim() : null;
};
const url = getEnvVar('VITE_SUPABASE_URL');
const key = getEnvVar('VITE_SUPABASE_ANON_KEY');

async function checkClasses() {
    try {
        console.log("--- Checking students table ---");
        const res = await fetch(`${url}/rest/v1/students?select=*&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const data = await res.json();
        console.log("Single student:", data);

    } catch (e) {
        console.error('Error:', e);
    }
}
checkClasses();
