const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08LI12 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Construção de repertório lexical | Construir repertório lexical relativo a planos, previsões e expectativas para o futuro.
EF08LI13 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Formação de palavras: prefixos e sufixos | Reconhecer sufixos e prefixos comuns utilizados na formação de palavras em língua inglesa.
EF08LI14 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Verbos para indicar o futuro | Utilizar formas verbais do futuro para descrever planos e expectativas e fazer previsões.
EF08LI15 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Comparativos e superlativos | Utilizar, de modo inteligível, as formas comparativas e superlativas de adjetivos para comparar qualidades e quantidades.
EF08LI16 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Quantificadores | Utilizar, de modo inteligível, corretamente, some, any, many, much.
EF08LI17 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Pronomes relativos | Empregar, de modo inteligível, os pronomes relativos (who, which, that, whose) para construir períodos compostos por subordinação.
EF08LI18 | EIXO DIMENSÃO INTERCULTURAL. Manifestações culturais. Construção de repertório artístico-cultural | Construir repertório cultural por meio do contato com manifestações artístico-culturais vinculadas à língua inglesa (artes plásticas e visuais, literatura, música, cinema, dança, festividades, entre outros), valorizando a diversidade entre culturas.
EF08LI19 | EIXO DIMENSÃO INTERCULTURAL. Comunicação intercultural. Impacto de aspectos culturais na comunicação | Investigar de que forma expressões, gestos e comportamentos são interpretados em função de aspectos culturais.
EF08LI20 | EIXO DIMENSÃO INTERCULTURAL. Comunicação intercultural. Impacto de aspectos culturais na comunicação | Examinar fatores que podem impedir o entendimento entre pessoas de culturas diferentes que falam a língua inglesa.
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

            skillsToInsert.push({ code, description: fullDescription, subject: "LÍNGUA INGLESA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
