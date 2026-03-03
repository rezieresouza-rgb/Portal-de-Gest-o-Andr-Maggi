const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67LP08 | Efeitos de sentido. Exploração da multissemiose | Identificar os efeitos de sentido devidos à escolha de imagens estáticas, sequenciação ou sobreposição de imagens, definição de figura/fundo, ângulo, profundidade e foco, cores/tonalidades, relação com o escrito (relações de reiteração, complementação ou oposição) etc. em notícias, reportagens, fotorreportagens, foto-denúncias, memes, gifs, anúncios publicitários e propagandas publicados em jornais, revistas, sites na internet etc.
EF67LP09 | Estratégias de produção: planejamento de textos informativos | Planejar notícia impressa e para circulação em outras mídias (rádio ou TV/vídeo), tendo em vista as condições de produção, do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. –, a partir da escolha do fato a ser noticiado (de relevância para a turma, escola ou comunidade), do levantamento de dados e informações sobre o fato – que pode envolver entrevistas com envolvidos ou com especialistas, consultas a fontes, análise de documentos, cobertura de eventos etc.-, do registro dessas informações e dados, da escolha de fotos ou imagens a produzir ou a utilizar etc. e a previsão de uma estrutura hipertextual (no caso de publicação em sites ou blogs noticiosos).
EF67LP10 | Textualização, tendo em vista suas condições de produção, as características do gênero em questão, o estabelecimento de coesão, adequação à norma-padrão e o uso adequado de ferramentas de edição | Produzir notícia impressa tendo em vista características do gênero – título ou manchete com verbo no tempo presente, linha fina (opcional), lide, progressão dada pela ordem decrescente de importância dos fatos, uso de 3ª pessoa, de palavras que indicam precisão –, e o estabelecimento adequado de coesão e produzir notícia para TV, rádio e internet, tendo em vista, além das características do gênero, os recursos de mídias disponíveis e o manejo de recursos de captação e edição de áudio e imagem.
EF67LP11 | Estratégias de produção: planejamento de textos argumentativos e apreciativos | Planejar resenhas, vlogs, vídeos e podcasts variados, e textos e vídeos de apresentação e apreciação próprios das culturas juvenis (algumas possibilidades: fanzines, fanclipes, e-zines, gameplay, detonado etc.), dentre outros, tendo em vista as condições de produção do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. –, a partir da escolha de uma produção ou evento cultural para analisar – livro, filme, série, game, canção, videoclipe, fanclipe, show, sarau, slams etc. – da busca de informação sobre a produção ou evento escolhido, da síntese de informações sobre a obra/evento e do elenco/seleção de aspectos, elementos ou recursos que possam ser destacados positiva ou negativamente ou da roteirização do passo a passo do game para posterior gravação dos vídeos.
EF67LP12 | Textualização de textos argumentativos e apreciativos | Produzir resenhas críticas, vlogs, vídeos, podcasts variados e produções e gêneros próprios das culturas juvenis (algumas possibilidades: fanzines, fanclipes, e-zines, gameplay, detonado etc.), que apresentem/descrevam e/ou avaliem produções culturais (livro, filme, série, game, canção, disco, videoclipe etc.) ou evento (show, sarau, slam etc.), tendo em vista o contexto de produção dado, as características do gênero, os recursos das mídias envolvidas e a textualização adequada dos textos e/ou produções.
EF67LP13 | Produção e edição de textos publicitários | Produzir, revisar e editar textos publicitários, levando em conta o contexto de produção dado, explorando recursos multissemióticos, relacionando elementos verbais e visuais, utilizando adequadamente estratégias discursivas de persuasão e/ou convencimento e criando título ou slogan que façam o leitor motivar-se a interagir com o texto produzido e se sinta atraído pelo serviço, ideia ou produto em questão.
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
