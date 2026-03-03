const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07LI12 | EIXO ESCRITA. Estratégias de escrita: pré-escrita e escrita. Pré-escrita: planejamento de produção escrita, com mediação do professor | Planejar a escrita de textos em função do contexto (público, finalidade, layout e suporte).
EF07LI13 | EIXO ESCRITA. Estratégias de escrita: pré-escrita e escrita. Escrita: organização em parágrafos ou tópicos, com mediação do professor | Organizar texto em unidades de sentido, dividindo-o em parágrafos ou tópicos e subtópicos, explorando as possibilidades de organização gráfica, de suporte e de formato do texto.
EF07LI14 | EIXO ESCRITA. Práticas de escrita. Produção de textos escritos, em formatos diversos, com mediação do professor | Produzir textos diversos sobre fatos, acontecimentos e personalidades do passado (linha do tempo/timelines, biografias, verbetes de enciclopédias, blogues, entre outros).
EF07LI15 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Construção de repertório lexical | Construir repertório lexical relativo a verbos regulares e irregulares (formas no passado), preposições de tempo (in, on, at) e conectores (and, but, because, then, so, before, after, entre outros).
EF07LI16 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Pronúncia | Reconhecer a pronúncia de verbos regulares no passado (-ed).
EF07LI17 | EIXO CONHECIMENTOS LINGUÍSTICOS. Estudo do léxico. Polissemia | Explorar o caráter polissêmico de palavras de acordo com o contexto de uso.
EF07LI18 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Passado simples e contínuo (formas afirmativa, negativa e interrogativa) | Utilizar o passado simples e o passado contínuo para produzir textos orais e escritos, mostrando relações de sequência e causalidade.
EF07LI19 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Pronomes do caso reto e do caso oblíquo | Discriminar sujeito de objeto utilizando pronomes a eles relacionados.
EF07LI20 | EIXO CONHECIMENTOS LINGUÍSTICOS. Gramática. Verbo modal can (presente e passado) | Empregar, de forma inteligível, o verbo modal can para descrever habilidades (no presente e no passado).
EF07LI21 | EIXO DIMENSÃO INTERCULTURAL. A língua inglesa no mundo. A língua inglesa como língua global na sociedade contemporânea | Analisar o alcance da língua inglesa e os seus contextos de uso no mundo globalizado.
EF07LI22 | EIXO DIMENSÃO INTERCULTURAL. Comunicação intercultural. Variação linguística | Explorar modos de falar em língua inglesa, refutando preconceitos e reconhecendo a variação linguística como fenômeno natural das línguas.
EF07LI23 | EIXO DIMENSÃO INTERCULTURAL. Comunicação intercultural. Variação linguística | Reconhecer a variação linguística como manifestação de formas de pensar e expressar o mundo.
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
