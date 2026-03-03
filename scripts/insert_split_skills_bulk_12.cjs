const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06LP01 | Reconstrução do contexto de produção, circulação e recepção de textos | Reconhecer a impossibilidade de uma neutralidade absoluta no relato de fatos e identificar diferentes graus de parcialidade/imparcialidade dados pelo recorte feito e pelos efeitos de sentido advindos de escolhas feitas pelo autor, de forma a poder desenvolver uma atitude crítica frente aos textos jornalísticos e tornar-se consciente das escolhas feitas enquanto produtor de textos.
EF07LP01 | Reconstrução do contexto de produção, circulação e recepção de textos | Distinguir diferentes propostas editoriais – sensacionalismo, jornalismo investigativo etc. –, de forma a identificar os recursos utilizados para impactar/chocar o leitor que podem comprometer uma análise crítica da notícia e do fato noticiado.
EF06LP02 | Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Estabelecer relação entre os diferentes gêneros jornalísticos, compreendendo a centralidade da notícia.
EF07LP02 | Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Comparar notícias e reportagens sobre um mesmo fato divulgadas em diferentes mídias, analisando as especificidades das mídias, os processos de (re)elaboração dos textos e a convergência das mídias em notícias ou reportagens multissemióticas.
EF67LP01 | Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Analisar a estrutura e funcionamento dos hiperlinks em textos noticiosos publicados na Web e vislumbrar possibilidades de uma escrita hipertextual.
EF67LP02 | Apreciação e réplica | Explorar o espaço reservado ao leitor nos jornais, revistas, impressos e on-line, sites noticiosos etc., destacando notícias, fotorreportagens, entrevistas, charges, assuntos, temas, debates em foco, posicionando-se de maneira ética e respeitosa frente a esses textos e opiniões a eles relacionadas, e publicar notícias, notas jornalísticas, fotorreportagem de interesse geral nesses espaços do leitor.
EF67LP03 | Relação entre textos | Comparar informações sobre um mesmo fato divulgadas em diferentes veículos e mídias, analisando e avaliando a confiabilidade.
EF67LP04 | Estratégia de leitura. Distinção de fato e opinião | Distinguir, em segmentos descontínuos de textos, fato da opinião enunciada em relação a esse mesmo fato.
EF67LP05 | Estratégia de leitura: identificação de teses e argumentos. Apreciação e réplica | Identificar e avaliar teses/opiniões/posicionamentos explícitos e argumentos em textos argumentativos (carta de leitor, comentário, artigo de opinião, resenha crítica etc.), manifestando concordância ou discordância.
EF67LP06 | Efeitos de sentido | Identificar os efeitos de sentido provocados pela seleção lexical, topicalização de elementos e seleção e hierarquização de informações, uso de 3ª pessoa etc.
EF67LP07 | Efeitos de sentido | Identificar o uso de recursos persuasivos em textos argumentativos diversos (como a elaboração do título, escolhas lexicais, construções metafóricas, a explicitação ou a ocultação de fontes de informação) e perceber seus efeitos de sentido.
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

            // Not using backticks to avoid escaping syntax issues
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF00";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({
                code: code,
                description: fullDescription,
                subject: "LÍNGUA PORTUGUESA",
                year_range: year_range
            });
        }
    }

    if (skillsToInsert.length === 0) {
        console.log("Nenhuma habilidade encontrada para inserir.");
        return;
    }

    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");

    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Erro na inserção:", error);
    } else {
        const count = result ? result.length : 0;
        console.log("Sucesso! Foram inseridas/atualizadas " + count + " habilidades no banco separadas corretamente!");
    }
}

importSkills();
