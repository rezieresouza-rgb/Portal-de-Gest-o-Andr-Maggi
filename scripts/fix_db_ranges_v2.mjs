
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

async function fix() {
    console.log('--- INICIANDO CORREÇÃO ROBUSTA DE YEAR_RANGE ---');
    const { data, error } = await supabase.from('bncc_skills').select('*');
    if (error) {
        console.error('Erro ao buscar:', error.message);
        return;
    }

    console.log(`Total no banco: ${data.length} habilidades.`);
    const updates = [];

    data.forEach(r => {
        const code = r.code.toUpperCase();
        let correctRange = r.year_range; // Default to current

        if (code.startsWith('EF06')) correctRange = 'EF06';
        else if (code.startsWith('EF07')) correctRange = 'EF07';
        else if (code.startsWith('EF08')) correctRange = 'EF08';
        else if (code.startsWith('EF09')) correctRange = 'EF09';
        else if (code.startsWith('EF67')) correctRange = 'EF67';
        else if (code.startsWith('EF89')) correctRange = 'EF89';
        else if (code.startsWith('EF69')) correctRange = 'EF69';

        if (correctRange !== r.year_range) {
            updates.push({ ...r, year_range: correctRange });
        }
    });

    if (updates.length === 0) {
        console.log('Nenhuma correção necessária.');
        return;
    }

    console.log(`Atualizando ${updates.length} habilidades com novos ranges...`);

    for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const { error: upError } = await supabase.from('bncc_skills').upsert(batch, { onConflict: 'code' });
        if (upError) {
            console.error(`Erro no lote ${i}:`, upError.message);
        } else {
            console.log(`Lote ${i / 50 + 1} finalizado (${batch.length} itens)...`);
        }
    }

    console.log('--- CORREÇÃO FINALIZADA ---');
}

fix();
