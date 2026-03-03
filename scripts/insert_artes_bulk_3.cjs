const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69AR31 | Artes integradas. Contextos e práticas | Relacionar as práticas artísticas às diferentes dimensões da vida social, cultural, política, histórica, econômica, estética e ética.
EF69AR32 | Artes integradas. Processos de criação | Analisar e explorar, em projetos temáticos, as relações processuais entre diversas linguagens artísticas.
EF69AR33 | Artes integradas. Matrizes estéticas e culturais | Analisar aspectos históricos, sociais e políticos da produção artística, problematizando as narrativas eurocêntricas e as diversas categorizações da arte (arte, artesanato, folclore, design etc.).
EF69AR34 | Artes integradas. Patrimônio cultural | Analisar e valorizar o patrimônio cultural, material e imaterial, de culturas diversas, em especial a brasileira, incluindo suas matrizes indígenas, africanas e europeias, de diferentes épocas, e favorecendo a construção de vocabulário e repertório relativos às diferentes linguagens artísticas.
EF69AR35 | Artes integradas. Arte e tecnologia | Identificar e manipular diferentes tecnologias e recursos digitais para acessar, apreciar, produzir, registrar e compartilhar práticas e repertórios artísticos, de modo reflexivo, ético e responsável.
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
            skillsToInsert.push({ code, description: fullDescription, subject: "ARTES", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
