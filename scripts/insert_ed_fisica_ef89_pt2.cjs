const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89EF16 | Lutas. Lutas do mundo | Experimentar e fruir a execução dos movimentos pertencentes às lutas do mundo, adotando procedimentos de segurança e respeitando o oponente.
EF89EF17 | Lutas. Lutas do mundo | Planejar e utilizar estratégias básicas das lutas experimentadas, reconhecendo as suas características técnico-táticas.
EF89EF18 | Lutas. Lutas do mundo | Discutir as transformações históricas, o processo de esportivização e a midiatização de uma ou mais lutas, valorizando e respeitando as culturas de origem.
EF89EF19 | Práticas corporais de aventura. Práticas corporais de aventura na natureza | Experimentar e fruir diferentes práticas corporais de aventura na natureza, valorizando a própria segurança e integridade física, bem como as dos demais, respeitando o patrimônio natural e minimizando os impactos de degradação ambiental.
EF89EF20 | Práticas corporais de aventura. Práticas corporais de aventura na natureza | Identificar riscos, formular estratégias e observar normas de segurança para superar os desafios na realização de práticas corporais de aventura na natureza.
EF89EF21 | Práticas corporais de aventura. Práticas corporais de aventura na natureza | Identificar as características (equipamentos de segurança, instrumentos, indumentária, organização) das práticas corporais de aventura na natureza, bem como suas transformações históricas.
`;

async function importSkills() {
    const lines = rawData.trim().split('\n');
    const skillsToInsert = [];
    for (let line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            const code = parts[0];
            const knowledgeObject = parts[1];
            const description = parts.slice(2).join(' | ');
            const yearMatch = code.match(/EF(\d{2})/);
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF00";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "EDUCAÇÃO FÍSICA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
