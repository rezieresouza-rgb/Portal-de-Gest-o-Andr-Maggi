const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP08 | Estratégia de produção: planejamento de textos informativos | Planejar reportagem impressa e em outras mídias (rádio ou TV/vídeo, sites), tendo em vista as condições de produção do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. – a partir da escolha do fato a ser aprofundado ou do tema a ser focado (de relevância para a turma, escola ou comunidade), do levantamento de dados e informações sobre o fato ou tema – que pode envolver entrevistas com envolvidos ou com especialistas, consultas a fontes diversas, análise de documentos, cobertura de eventos etc. -, do registro dessas informações e dados, da escolha de fotos ou imagens a produzir ou a utilizar etc., da produção de infográficos, quando for o caso, e da organização hipertextual (no caso a publicação em sites ou blogs noticiosos ou mesmo de jornais impressos, por meio de boxes variados).
EF89LP09 | Estratégia de produção: textualização de textos informativos | Produzir reportagem impressa, com título, linha fina (optativa), organização composicional (expositiva, interpretativa e/ou opinativa), progressão temática e uso de recursos linguísticos compatíveis com as escolhas feitas e reportagens multimidiáticas, tendo em vista as condições de produção, as características do gênero, os recursos e mídias disponíveis, sua organização hipertextual e o manejo adequado de recursos de captação e edição de áudio e imagem e adequação à norma-padrão.
EF89LP10 | Estratégia de produção: planejamento de textos argumentativos e apreciativos | Planejar artigos de opinião, tendo em vista as condições de produção do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. –, a partir da escolha do tema ou questão a ser discutido(a), da relevância para a turma, escola ou comunidade, do levantamento de dados e informações sobre a questão, de argumentos relacionados a diferentes posicionamentos em jogo, da definição – o que pode envolver consultas a fontes diversas, entrevistas com especialistas, análise de textos, organização esquemática das informações e argumentos – dos (tipos de) argumentos e estratégias que pretende utilizar para convencer os leitores.
EF08LP03 | Textualização de textos argumentativos e apreciativos | Produzir artigos de opinião, tendo em vista o contexto de produção dado, a defesa de um ponto de vista, utilizando argumentos e contra-argumentos e articuladores de coesão que marquem relações de oposição, contraste, exemplificação, ênfase.
EF09LP03 | Textualização de textos argumentativos e apreciativos | Produzir artigos de opinião, tendo em vista o contexto de produção dado, assumindo posição diante de tema polêmico, argumentando de acordo com a estrutura própria desse tipo de texto e utilizando diferentes tipos de argumentos – de autoridade, comprovação, exemplificação, princípio etc.
EF89LP11 | Estratégias de produção: planejamento, textualização, revisão e edição de textos publicitários | Produzir, revisar e editar peças e campanhas publicitárias, envolvendo o uso articulado e complementar de diferentes peças publicitárias: cartaz, banner, indoor, folheto, panfleto, anúncio de jornal/revista, para internet, spot, propaganda de rádio, TV, a partir da escolha de questão/problema/causa significativa para a escola e/ou a comunidade escolar, da definição do público-alvo, das peças que serão produzidas, das estratégias de persuasão e convencimento que serão utilizadas.
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
