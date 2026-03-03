const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF09LI10 | EIXO ESCRITA. Estratégias de escrita. Escrita: construção da argumentação | Propor potenciais argumentos para expor e defender ponto de vista em texto escrito, refletindo sobre o tema proposto e pesquisando dados, evidências e exemplos para sustentar os argumentos, organizando-os em sequência lógica.
EF09LI11 | EIXO ESCRITA. Estratégias de escrita. Escrita: construção da persuasão | Utilizar recursos verbais e não verbais para construção da persuasão em textos da esfera publicitária, de forma adequada ao contexto de circulação (produção e compreensão).
EF09LI12 | EIXO ESCRITA. Práticas de escrita. Produção de textos escritos, com mediação do professor/colegas | Produzir textos (infográficos, fóruns de discussão on-line, fotorreportagens, campanhas publicitárias, memes, entre outros) sobre temas de interesse coletivo local ou global, que revelem posicionamento crítico.
EF09LI13 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Usos de linguagem em meio digital: "internetês" | Reconhecer, nos novos gêneros digitais (blogues, mensagens instantâneas, tweets, entre outros), novas formas de escrita (abreviação de palavras, palavras com combinação de letras e números, pictogramas, símbolos gráficos, entre outros) na constituição das mensagens.
EF09LI14 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Conectores (linking words) | Utilizar conectores indicadores de adição, condição, oposição, contraste, conclusão e síntese como auxiliares na construção da argumentação e intencionalidade discursiva.
EF09LI15 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Orações condicionais (tipos 1 e 2) | Empregar, de modo inteligível, as formas verbais em orações condicionais dos tipos 1 e 2 (if-clauses).
EF09LI16 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Verbos modais: should, must, have to, may e might | Empregar, de modo inteligível, os verbos should, must, have to, may e might para indicar recomendação, necessidade ou obrigação e probabilidade.
EF09LI17 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no mundo. Expansão da língua inglesa: contexto histórico | Debater sobre a expansão da língua inglesa pelo mundo, em função do processo de colonização nas Américas, África, Ásia e Oceania.
EF09LI18 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no mundo. A língua inglesa e seu papel no intercâmbio científico, econômico e político | Analisar a importância da língua inglesa para o desenvolvimento das ciências (produção, divulgação e discussão de novos conhecimentos), da economia e da política no cenário mundial.
EF09LI19 | EIXO DIMENSÃO INTERCULTURAL. Comunicação intercultural. Construção de identidades no mundo globalizado | Discutir a comunicação intercultural por meio da língua inglesa como mecanismo de valorização pessoal e de construção de identidades no mundo globalizado.
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
