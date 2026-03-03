const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF09GE14 | Formas de representação e pensamento espacial. Leitura e elaboração de mapas temáticos, croquis e outras formas de representação para analisar informações geográficas | Elaborar e interpretar gráficos de barras e de setores, mapas temáticos e esquemáticos (croquis) e anamorfoses geográficas para analisar, sintetizar e apresentar dados e informações sobre diversidade, diferenças e desigualdades sociopolíticas e geopolíticas mundiais.
EF09GE15 | Formas de representação e pensamento espacial. Leitura e elaboração de mapas temáticos, croquis e outras formas de representação para analisar informações geográficas | Comparar e classificar diferentes regiões do mundo com base em informações populacionais, econômicas e socioambientais representadas em mapas temáticos e com diferentes projeções cartográficas.
EF09GE16 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na Europa, na Ásia e na Oceania | Identificar e comparar diferentes domínios morfoclimáticos da Europa, da Ásia e da Oceania.
EF09GE17 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na Europa, na Ásia e na Oceania | Explicar as características físico-naturais e a forma de ocupação e usos da terra em diferentes regiões da Europa, da Ásia e da Oceania.
EF09GE18 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na Europa, na Ásia e na Oceania | Identificar e analisar as cadeias industriais e de inovação e as consequências dos usos de recursos naturais e das diferentes fontes de energia (tais como termoelétrica, hidrelétrica, eólica e nuclear) em diferentes países.
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

            skillsToInsert.push({ code, description: fullDescription, subject: "GEOGRAFIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
