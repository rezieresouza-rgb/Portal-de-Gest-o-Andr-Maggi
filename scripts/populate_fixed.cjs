
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EF_FILE = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

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

async function populateEF2() {
    let allSkillsMap = new Map();
    console.log('--- TARGETED EF2 EXTRACTION START (6º-9º ANO) ---');

    try {
        if (!fs.existsSync(EF_FILE)) {
            console.error('File not found:', EF_FILE);
            return;
        }

        const workbook = XLSX.readFile(EF_FILE);

        workbook.SheetNames.forEach(sheetName => {
            const normSheetName = normalize(sheetName);
            // Ignorar abas de competências gerais ou introdução
            if (normSheetName.includes('COMPETENCIAS') || normSheetName.includes('ESTRUTURA')) return;

            console.log(`Lendo aba: ${sheetName}`);
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
                    // Regex focada em EF II: EF06, EF07, EF08, EF09 e ranges como EF67, EF89, EF69
                    const codeMatch = text.match(/\(?((EF0[6-9]|EF[6-9][6-9])[A-Z0-9]{2,})\)?/i);

                    if (codeMatch) {
                        const code = codeMatch[1].toUpperCase();
                        let description = text.replace(codeMatch[0], '').trim();

                        // Tentativa de pegar descrição na célula ao lado se estiver vazia
                        if (description.length < 10) {
                            const next_cell = sheet[XLSX.utils.encode_cell({ c: C + 1, r: R })];
                            if (next_cell && next_cell.v) {
                                const neighbor = String(next_cell.v).trim();
                                if (neighbor.length > 5) description = neighbor;
                            }
                        }

                        if (code && description.length > 5) {
                            const yrMatch = code.match(/^EF(\d{2})/i);
                            const yearRange = yrMatch ? `EF${yrMatch[1]}` : 'EF69'; // Fallback para range genérico do 2º ciclo

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

        const unique = Array.from(allSkillsMap.values());
        console.log(`\nExtração concluída. Habilidades EF II encontradas: ${unique.length}`);

        if (unique.length > 0) {
            console.log('Sincronizando com Supabase (EF II)...');
            const BATCH = 30;
            let totalInserted = 0;
            for (let i = 0; i < unique.length; i += BATCH) {
                const batch = unique.slice(i, i + BATCH);
                const { data, error } = await supabase.from('bncc_skills').upsert(batch, { onConflict: 'code' }).select();
                if (error) {
                    console.error(`Erro:`, error.message);
                } else if (data) {
                    totalInserted += data.length;
                    process.stdout.write('+');
                }
            }
            console.log(`\nSucesso! ${totalInserted} habilidades inseridas/atualizadas.`);
        } else {
            console.warn('Nenhuma habilidade EF II (6-9) encontrada no arquivo.');
        }

    } catch (e) {
        console.error(`Erro fatal:`, e.message);
    }
}

populateEF2();
