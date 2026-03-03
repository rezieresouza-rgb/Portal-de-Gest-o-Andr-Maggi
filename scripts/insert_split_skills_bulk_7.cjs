const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP35 | Consideração das condições de produção de textos de divulgação científica. Estratégias de escrita | Planejar textos de divulgação científica, a partir da elaboração de esquema que considere as pesquisas feitas anteriormente, de notas e sínteses de leituras ou de registros de experimentos ou de estudo de campo, produzir, revisar e editar textos voltados para a divulgação do conhecimento e de dados e resultados de pesquisas, tais como artigo de divulgação científica, artigo de opinião, reportagem científica, verbete de enciclopédia, verbete de enciclopédia digital colaborativa, infográfico, relatório, relato de experimento científico, relato (multimidiático) de campo, tendo em vista seus contextos de produção, que podem envolver a disponibilização de informações e conhecimentos em circulação em um formato mais acessível para um público específico ou a divulgação de conhecimentos advindos de pesquisas bibliográficas, experimentos científicos e estudos de campo realizados.
EF69LP36 | Estratégias de escrita: textualização, revisão e edição | Produzir, revisar e editar textos voltados para a divulgação do conhecimento e de dados e resultados de pesquisas, tais como artigo de divulgação científica, verbete de enciclopédia, infográfico, infográfico animado, podcast ou vlog científico, relato de experimento, relatório, relato multimidiático de campo, dentre outros, considerando o contexto de produção e as regularidades dos gêneros em termos de suas construções composicionais e estilos.
EF69LP37 | Estratégias de produção | Produzir roteiros para elaboração de vídeos de diferentes tipos (vlog científico, vídeo-minuto, programa de rádio, podcasts) para divulgação de conhecimentos científicos e resultados de pesquisa, tendo em vista seu contexto de produção, os elementos e a construção composicional dos roteiros.
EF69LP38 | Estratégias de produção: planejamento e produção de apresentações orais | Organizar os dados e informações pesquisados em painéis ou slides de apresentação, levando em conta o contexto de produção, o tempo disponível, as características do gênero apresentação oral, a multissemiose, as mídias e tecnologias que serão utilizadas, ensaiar a apresentação, considerando também elementos paralinguísticos e cinésicos e proceder à exposição oral de resultados de estudos e pesquisas, no tempo determinado, a partir do planejamento e da definição de diferentes formas de uso da fala – memorizada, com apoio da leitura ou fala espontânea.
EF69LP39 | Estratégias de produção | Definir o recorte temático da entrevista e o entrevistado, levantar informações sobre o entrevistado e sobre o tema da entrevista, elaborar roteiro de perguntas, realizar entrevista, a partir do roteiro, abrindo possibilidades para fazer perguntas a partir da resposta, se o contexto permitir, tomar nota, gravar ou salvar a entrevista e usar adequadamente as informações obtidas, de acordo com os objetivos estabelecidos.
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
