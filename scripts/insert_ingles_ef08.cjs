const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08LI01 | EIXO ORALIDADE. Interação discursiva. Negociação de sentidos (mal-entendidos no uso da língua inglesa e conflito de opiniões) | Fazer uso da língua inglesa para resolver mal-entendidos, emitir opiniões e esclarecer informações por meio de paráfrases ou justificativas.
EF08LI02 | EIXO ORALIDADE. Interação discursiva. Usos de recursos linguísticos e paralinguísticos no intercâmbio oral | Explorar o uso de recursos linguísticos (frases incompletas, hesitações, entre outros) e paralinguísticos (gestos, expressões faciais, entre outros) em situações de interação oral.
EF08LI03 | EIXO ORALIDADE. Compreensão oral. Compreensão de textos orais, multimodais, de cunho informativo/jornalístico | Construir o sentido global de textos orais, relacionando suas partes, o assunto principal e informações relevantes.
EF08LI04 | EIXO ORALIDADE. Produção oral. Produção de textos orais com autonomia | Utilizar recursos e repertório linguísticos apropriados para informar/comunicar/falar do futuro: planos, previsões, possibilidades e probabilidades.
EF08LI05 | EIXO LEITURA. Estratégias de leitura. Construção de sentidos por meio de inferências e reconhecimento de implícitos | Inferir informações e relações que não aparecem de modo explícito no texto para construção de sentidos.
EF08LI06 | EIXO LEITURA. Práticas de leitura e fruição. Leitura de textos de cunho artístico/literário | Apreciar textos narrativos em língua inglesa (contos, romances, entre outros, em versão original ou simplificada), como forma de valorizar o patrimônio cultural produzido em língua inglesa.
EF08LI07 | EIXO LEITURA. Práticas de leitura e fruição. Leitura de textos de cunho artístico/literário | Explorar ambientes virtuais e/ou aplicativos para acessar e usufruir do patrimônio artístico literário em língua inglesa.
EF08LI08 | EIXO LEITURA. Avaliação dos textos lidos. Reflexão pós-leitura | Analisar, criticamente, o conteúdo de textos, comparando diferentes perspectivas apresentadas sobre um mesmo assunto.
EF08LI09 | EIXO ESCRITA. Estratégias de escrita: escrita e pós-escrita. Revisão de textos com a mediação do professor | Avaliar a própria produção escrita e a de colegas, com base no contexto de comunicação (finalidade e adequação ao público, conteúdo a ser comunicado, organização textual, legibilidade, estrutura de frases).
EF08LI10 | EIXO ESCRITA. Estratégias de escrita: escrita e pós-escrita. Revisão de textos com a mediação do professor | Reconstruir o texto, com cortes, acréscimos, reformulações e correções, para aprimoramento, edição e publicação final.
EF08LI11 | EIXO ESCRITA. Práticas de escrita. Produção de textos escritos com mediação do professor/colegas | Produzir textos (comentários em fóruns, relatos pessoais, mensagens instantâneas, tweets, reportagens, histórias de ficção, blogues, entre outros), com o uso de estratégias de escrita (planejamento, produção de rascunho, revisão e edição final), apontando sonhos e projetos para o futuro (pessoal, da família, da comunidade ou do planeta).
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
