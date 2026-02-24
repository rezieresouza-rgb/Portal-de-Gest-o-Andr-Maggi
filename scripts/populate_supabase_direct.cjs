
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    { name: 'Ensino Fundamental', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx') },
    { name: 'Ensino Médio', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino_Medio.xlsx') }
];

// Ler .env.local
const portalPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi');
const envPath = path.join(portalPath, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const lines = envContent.split('\n');
    for (let line of lines) {
        if (line.trim().startsWith(name + '=')) {
            return line.split('=')[1].trim();
        }
    }
    return null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const subjectMapping = {
    'PORTU': 'LÍNGUA PORTUGUESA',
    'HISTO': 'HISTÓRIA',
    'GEOGRA': 'GEOGRAFIA',
    'CIENC': 'CIÊNCIAS',
    'MATEM': 'MATEMÁTICA',
    'ARTE': 'ARTE',
    'FISIC': 'EDUCAÇÃO FÍSICA',
    'INGLE': 'LÍNGUA INGLESA',
    'RELIGIO': 'ENSINO RELIGIOSO'
};

function normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

async function populateVerified() {
    let allSkillsMap = new Map();
    console.log('--- VERIFIED BRUTE FORCE EXTRACTION START ---');

    files.forEach(file => {
        try {
            if (!fs.existsSync(file.path)) return;
            console.log(`Lendo arquivo: ${file.name}`);
            const workbook = XLSX.readFile(file.path);

            workbook.SheetNames.forEach(sheetName => {
                const normSheetName = normalize(sheetName);
                if (normSheetName.includes('COMPETENCIAS') || normSheetName.includes('ESTRUTURA') || normSheetName.includes('COMENTADO')) return;

                const sheet = workbook.Sheets[sheetName];
                if (!sheet['!ref']) return;
                const range = XLSX.utils.decode_range(sheet['!ref']);

                // Detectar disciplina
                let detectedSubject = 'OUTROS';
                for (const [key, val] of Object.entries(subjectMapping)) {
                    if (normSheetName.includes(key)) {
                        detectedSubject = val;
                        break;
                    }
                }

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
                        if (!cell || !cell.v || typeof cell.v !== 'string') continue;

                        const text = cell.v.trim();
                        const codeMatch = text.match(/\(?((EF|EM)\d+[A-Z0-9]{2,})\)?/i);
                        if (codeMatch) {
                            const code = codeMatch[1].toUpperCase();
                            let description = text.replace(codeMatch[0], '').trim();

                            if (description.length < 10) {
                                const next_cell = sheet[XLSX.utils.encode_cell({ c: C + 1, r: R })];
                                if (next_cell && next_cell.v) {
                                    const neighbor = String(next_cell.v).trim();
                                    if (neighbor.length > 5) description = neighbor;
                                }
                            }

                            if (code && description.length > 5) {
                                const type = code.startsWith('EF') ? 'EF' : 'EM';
                                const yrMatch = code.match(/^(EF|EM)(\d{2})/i);
                                const yearRange = yrMatch ? `${type}${yrMatch[2]}` : (type === 'EM' ? 'EM0103' : 'EF00');

                                allSkillsMap.set(code, {
                                    code,
                                    description,
                                    subject: detectedSubject,
                                    year_range: yearRange
                                });
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error(`Erro:`, e.message);
        }
    });

    const unique = Array.from(allSkillsMap.values());
    console.log(`Total Extraído: ${unique.length} habilidades.`);

    if (unique.length > 0) {
        console.log('Sincronizando VERIFICADO com Supabase...');
        const BATCH = 20;
        let successCount = 0;
        for (let i = 0; i < unique.length; i += BATCH) {
            const batch = unique.slice(i, i + BATCH);
            const { data, error } = await supabase.from('bncc_skills').upsert(batch, { onConflict: 'code' }).select();

            if (error) {
                console.error(`\nErro no lote ${i / BATCH + 1}:`, error.message);
            } else if (data) {
                successCount += data.length;
                process.stdout.write(`[${successCount}]`);
            }
        }
        console.log('\nSincronização concluída!');

        // Verificação final do total no banco
        const { count } = await supabase.from('bncc_skills').select('*', { count: 'exact', head: true });
        console.log(`Total final no banco de dados: ${count}`);
    }
}

populateVerified();
