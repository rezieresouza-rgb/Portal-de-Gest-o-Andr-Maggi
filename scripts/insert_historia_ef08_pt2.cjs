const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08HI15 | Brasil: Primeiro Reinado. O Período Regencial e as contestações ao poder central. O Brasil do Segundo Reinado: política e economia. A Lei de Terras e seus desdobramentos na política do Segundo Reinado. Territórios e fronteiras: a Guerra do Paraguai | Identificar e analisar o equilíbrio das forças e os sujeitos envolvidos nas disputas políticas durante o Primeiro e o Segundo Reinado.
EF08HI16 | Brasil: Primeiro Reinado. O Período Regencial e as contestações ao poder central. O Brasil do Segundo Reinado: política e economia. A Lei de Terras e seus desdobramentos na política do Segundo Reinado. Territórios e fronteiras: a Guerra do Paraguai | Identificar, comparar e analisar a diversidade política, social e regional nas rebeliões e nos movimentos contestatórios ao poder centralizado.
EF08HI17 | Brasil: Primeiro Reinado. O Período Regencial e as contestações ao poder central. O Brasil do Segundo Reinado: política e economia. A Lei de Terras e seus desdobramentos na política do Segundo Reinado. Territórios e fronteiras: a Guerra do Paraguai | Relacionar as transformações territoriais, em razão de questões de fronteiras, com as tensões e conflitos durante o Império.
EF08HI18 | Brasil: Primeiro Reinado. O Período Regencial e as contestações ao poder central. O Brasil do Segundo Reinado: política e economia. A Lei de Terras e seus desdobramentos na política do Segundo Reinado. Territórios e fronteiras: a Guerra do Paraguai | Identificar as questões internas e externas sobre a atuação do Brasil na Guerra do Paraguai e discutir diferentes versões sobre o conflito.
EF08HI19 | O escravismo no Brasil do século XIX: plantations e revoltadas de escravizados, abolicionismo e políticas migratórias no Brasil Imperial | Formular questionamentos sobre o legado da escravidão nas Américas, com base na seleção e consulta de fontes de diferentes naturezas.
EF08HI20 | O escravismo no Brasil do século XIX: plantations e revoltadas de escravizados, abolicionismo e políticas migratórias no Brasil Imperial | Identificar e relacionar aspectos das estruturas sociais da atualidade com os legados da escravidão no Brasil e discutir a importância de ações afirmativas.
EF08HI21 | Políticas de extermínio do indígena durante o Império | Identificar e analisar as políticas oficiais com relação ao indígena durante o Império.
EF08HI22 | A produção do imaginário nacional brasileiro: cultura popular, representações visuais, letras e o Romantismo no Brasil | Discutir o papel das culturas letradas, não letradas e das artes na produção das identidades no Brasil do século XIX.
EF08HI23 | Nacionalismo, revoluções e as novas nações europeias | Estabelecer relações causais entre as ideologias raciais e o determinismo no contexto do imperialismo europeu e seus impactos na África e na Ásia.
EF08HI24 | Uma nova ordem econômica: as demandas do capitalismo industrial e o lugar das economias africanas e asiáticas nas dinâmicas globais | Reconhecer os principais produtos, utilizados pelos europeus, procedentes do continente africano durante o imperialismo e analisar os impactos sobre as comunidades locais na forma de organização e exploração econômica.
EF08HI25 | Os Estados Unidos da América e a América Latina no século XIX | Caracterizar e contextualizar aspectos das relações entre os Estados Unidos da América e a América Latina no século XIX.
EF08HI26 | O Imperialismo europeu e a partilha da África e da Ásia | Identificar e contextualizar o protagonismo das populações locais na resistência ao imperialismo na África e Ásia.
EF08HI27 | Pensamento e cultura no século XIX: darwinismo e racismo. O discurso civilizatório nas Américas, o silenciamento dos saberes indígenas e as formas de integração e destruição de comunidades e povos indígenas. A resistência dos povos e comunidades indígenas diante da ofensiva civilizatória | Identificar as tensões e os significados dos discursos civilizatórios, avaliando seus impactos negativos para os povos indígenas originários e as populações negras nas Américas.
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
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF08";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "HISTÓRIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir/atualizar " + skillsToInsert.length + " habilidades de HISTÓRIA (8º Ano - Parte 2)...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
