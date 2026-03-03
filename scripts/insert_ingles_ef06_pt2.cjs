const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06LI13 | EIXO ESCRITA. Estratégias de escrita: pré-escrita. Planejamento do texto: brainstorming | Listar ideias para a produção de textos, levando em conta o tema e o assunto.
EF06LI14 | EIXO ESCRITA. Estratégias de escrita: pré-escrita. Planejamento do texto: organização de ideias | Organizar ideias, selecionando-as em função da estrutura e do objetivo do texto.
EF06LI15 | EIXO ESCRITA. Práticas de escrita. Produção de textos escritos, em formatos diversos, com a mediação do professor | Produzir textos escritos em língua inglesa (histórias em quadrinhos, cartazes, chats, blogues, agendas, fotolegendas, entre outros), sobre si mesmo, sua família, seus amigos, gostos, preferências e rotinas, sua comunidade e seu contexto escolar.
EF06LI16 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Construção de repertório lexical | Construir repertório relativo às expressões usadas para o convívio social e o uso da língua inglesa em sala de aula.
EF06LI17 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Construção de repertório lexical | Construir repertório lexical relativo a temas familiares (escola, família, rotina diária, atividades de lazer, esportes, entre outros).
EF06LI18 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Pronúncia | Reconhecer semelhanças e diferenças na pronúncia de palavras da língua inglesa e da língua materna e/ou outras línguas conhecidas.
EF06LI19 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Presente simples e contínuo (formas afirmativa, negativa e interrogativa) | Utilizar o presente do indicativo para identificar pessoas (verbo to be) e descrever rotinas diárias.
EF06LI20 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Presente simples e contínuo (formas afirmativa, negativa e interrogativa) | Utilizar o presente contínuo para descrever ações em progresso.
EF06LI21 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Imperativo | Reconhecer o uso do imperativo em enunciados de atividades, comandos e instruções.
EF06LI22 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Caso genitivo ('s) | Descrever relações por meio do uso de apóstrofo (') + s.
EF06LI23 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Adjetivos possessivos | Empregar, de forma inteligível, os adjetivos possessivos.
EF06LI24 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no mundo. Países que têm a língua inglesa como língua materna e/ou oficial | Investigar o alcance da língua inglesa no mundo: como língua materna e/ou oficial (primeira ou segunda língua).
EF06LI25 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no cotidiano da sociedade brasileira/comunidade. Presença da língua inglesa no cotidiano | Identificar a presença da língua inglesa na sociedade brasileira/comunidade (palavras, expressões, suportes e esferas de circulação e consumo) e seu significado.
EF06LI26 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no cotidiano da sociedade brasileira/comunidade. Presença da língua inglesa no cotidiano | Avaliar, problematizando elementos/produtos culturais de países de língua inglesa absorvidos pela sociedade brasileira/comunidade.
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
