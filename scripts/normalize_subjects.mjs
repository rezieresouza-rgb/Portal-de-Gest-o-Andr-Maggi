
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

const SUBJECT_MAPPING = {
    'Língua Portuguesa': 'LÍNGUA PORTUGUESA',
    'Matemática': 'MATEMÁTICA',
    'Ciências': 'CIÊNCIAS',
    'História': 'HISTÓRIA',
    'Geografia': 'GEOGRAFIA',
    'Arte': 'ARTE',
    'Educação Física': 'EDUCAÇÃO FÍSICA',
    'Língua Inglesa': 'LÍNGUA INGLESA'
};

async function normalizeSubjects() {
    console.log('--- NORMALIZANDO NOMES DE DISCIPLINAS ---');
    const { data, error } = await supabase.from('bncc_skills').select('*');
    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    console.log(`Analisando ${data.length} registros...`);
    const updates = [];

    data.forEach(r => {
        // Encontrar o mapeamento correto ou apenas transformar em uppercase se não houver no mapa
        let upperSubject = r.subject.toUpperCase().trim();

        // Correção específica para Português se necessário
        if (upperSubject.includes('PORTUG')) upperSubject = 'LÍNGUA PORTUGUESA';
        if (upperSubject.includes('MATEM')) upperSubject = 'MATEMÁTICA';
        if (upperSubject.includes('CIENC')) upperSubject = 'CIÊNCIAS';
        if (upperSubject.includes('GEOGR')) upperSubject = 'GEOGRAFIA';
        if (upperSubject.includes('HISTOR')) upperSubject = 'HISTÓRIA';
        if (upperSubject.includes('ARTE')) upperSubject = 'ARTE';
        if (upperSubject.includes('FISICA')) upperSubject = 'EDUCAÇÃO FÍSICA';
        if (upperSubject.includes('INGLE')) upperSubject = 'LÍNGUA INGLESA';

        if (r.subject !== upperSubject) {
            updates.push({ ...r, subject: upperSubject });
        }
    });

    if (updates.length === 0) {
        console.log('Nenhuma mudança necessária nos nomes das disciplinas.');
        return;
    }

    console.log(`Atualizando ${updates.length} registros...`);
    for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const { error: upError } = await supabase.from('bncc_skills').upsert(batch, { onConflict: 'code' });
        if (upError) console.error(`Erro no lote ${i}:`, upError.message);
        else console.log(`Lote ${i / 50 + 1} finalizado...`);
    }

    console.log('--- NORMALIZAÇÃO CONCLUÍDA ---');
}

normalizeSubjects();
