
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...valParts] = line.split('=');
        if (key && valParts.length > 0) {
            env[key.trim()] = valParts.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function audit() {
    console.log('--- INICIANDO AUDITORIA DETALHADA ---');
    const { data, error } = await supabase.from('bncc_skills').select('subject, year_range');
    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    const results = {};
    data.forEach(r => {
        if (!results[r.subject]) results[r.subject] = new Set();
        results[r.subject].add(r.year_range);
    });

    console.log('Disciplinas e seus Year Ranges no Banco:');
    for (const sub in results) {
        console.log(`- ${sub}: [${Array.from(results[sub]).join(', ')}]`);
    }
}
audit();
