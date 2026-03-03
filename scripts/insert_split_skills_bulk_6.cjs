const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP29 | Reconstrução das condições de produção e recepção dos textos e adequação do texto à construção composicional e ao estilo de gênero | Refletir sobre a relação entre os contextos de produção dos gêneros de divulgação científica – texto didático, artigo de divulgação científica, reportagem de divulgação científica, verbete de enciclopédia (impressa e digital), esquema, infográfico (estático e animado), relatório, relato multimidiático de campo, podcasts e vídeos variados de divulgação científica etc. – e os aspectos relativos à construção composicional e às marcas linguística características desses gêneros, de forma a ampliar suas possibilidades de compreensão (e produção) de textos pertencentes a esses gêneros.
EF69LP30 | Relação entre textos | Comparar, com a ajuda do professor, conteúdos, dados e informações de diferentes fontes, levando em conta seus contextos de produção e referências, identificando coincidências, complementaridades e contradições, de forma a poder identificar erros/imprecisões conceituais, compreender e posicionar-se criticamente sobre os conteúdos e informações em questão.
EF69LP31 | Apreciação e réplica | Utilizar pistas linguísticas – tais como “em primeiro/segundo/terceiro lugar”, “por outro lado”, “dito de outro modo”, isto é”, “por exemplo” – para compreender a hierarquização das proposições, sintetizando o conteúdo dos textos.
EF69LP32 | Estratégias e procedimentos de leitura. Relação do verbal com outras semioses. Procedimentos e gêneros de apoio à compreensão | Selecionar informações e dados relevantes de fontes diversas (impressas, digitais, orais etc.), avaliando a qualidade e a utilidade dessas fontes, e organizar, esquematicamente, com ajuda do professor, as informações necessárias (sem excedê-las) com ou sem apoio de ferramentas digitais, em quadros, tabelas ou gráficos.
EF69LP33 | Estratégias e procedimentos de leitura. Relação do verbal com outras semioses. Procedimentos e gêneros de apoio à compreensão | Articular o verbal com os esquemas, infográficos, imagens variadas etc. na (re)construção dos sentidos dos textos de divulgação científica e retextualizar do discursivo para o esquemático – infográfico, esquema, tabela, gráfico, ilustração etc. – e, ao contrário, transformar o conteúdo das tabelas, esquemas, infográficos, ilustrações etc. em texto discursivo, como forma de ampliar as possibilidades de compreensão desses textos e analisar as características das multissemioses e dos gêneros em questão.
EF69LP34 | Estratégias e procedimentos de leitura. Relação do verbal com outras semioses. Procedimentos e gêneros de apoio à compreensão | Grifar as partes essenciais do texto, tendo em vista os objetivos de leitura, produzir marginálias (ou tomar notas em outro suporte), sínteses organizadas em itens, quadro sinóptico, quadro comparativo, esquema, resumo ou resenha do texto lido (com ou sem comentário/análise), mapa conceitual, dependendo do que for mais adequado, como forma de possibilitar uma maior compreensão do texto, a sistematização de conteúdos e informações e um posicionamento frente aos textos, se esse for o caso.
`;

async function importSkills() {
    const lines = rawData.trim().split('\n');
    const skillsToInsert = [];

    for (let line of lines) {
        if (!line.trim()) continue;

        // Split by the pipe character and trim whitespace
        const parts = line.split('|').map(p => p.trim());

        if (parts.length >= 3) {
            const code = parts[0];
            const knowledgeObject = parts[1];
            const description = parts.slice(2).join(' | ');

            const yearMatch = code.match(/EF(\d{2})/);
            const year_range = yearMatch ? `EF${yearMatch[1]}` : "EF00";

            skillsToInsert.push({
                code: code,
                description: `[Objeto de Conhecimento: ${knowledgeObject}] ${description}`,
                subject: "LÍNGUA PORTUGUESA",
                year_range: year_range
            });
        }
    }

    if (skillsToInsert.length === 0) {
        console.log("Nenhuma habilidade encontrada para inserir.");
        return;
    }

    console.log(`Preparando para inserir ${skillsToInsert.length} habilidades...`);

    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Erro na inserção:", error);
    } else {
        console.log(`Sucesso! Foram inseridas/atualizadas ${result ? result.length : 0} habilidades no banco separadas corretamente!`);
    }
}

importSkills();
