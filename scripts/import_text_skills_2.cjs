const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawText = `
(EF67LP01) Analisar a estrutura e funcionamento dos hiperlinks em textos noticiosos publicados na Web e vislumbrar possibilidades de uma escrita hipertextual.
(EF67LP02) Explorar o espaço reservado ao leitor nos jornais, revistas, impressos e on-line, sites noticiosos etc., destacando notícias, fotorreportagens, entrevistas, charges, assuntos, temas, debates em foco, posicionando-se de maneira ética e respeitosa frente a esses textos e opiniões a eles relacionadas, e publicar notícias, notas jornalísticas, fotorreportagem de interesse geral nesses espaços do leitor.
(EF67LP03) Comparar informações sobre um mesmo fato divulgadas em diferentes veículos e mídias, analisando e avaliando a confiabilidade.
(EF67LP04) Distinguir, em segmentos descontínuos de textos, fato da opinião enunciada em relação a esse mesmo fato.
(EF67LP05) Identificar e avaliar teses/opiniões/posicionamentos explícitos e argumentos em textos argumentativos (carta de leitor, comentário, artigo de opinião, resenha crítica etc.), manifestando concordância ou discordância.
(EF67LP06) Identificar os efeitos de sentido provocados pela seleção lexical, topicalização de elementos e seleção e hierarquização de informações, uso de 3ª pessoa etc.
(EF67LP07) Identificar o uso de recursos persuasivos em textos argumentativos diversos (como a elaboração do título, escolhas lexicais, construções metafóricas, a explicitação ou a ocultação de fontes de informação) e perceber seus efeitos de sentido.
(EF67LP08) Identificar os efeitos de sentido devidos à escolha de imagens estáticas, sequenciação ou sobreposição de imagens, definição de figura/fundo, ângulo, profundidade e foco, cores/tonalidades, relação com o escrito (relações de reiteração, complementação ou oposição) etc. em notícias, reportagens, fotorreportagens, foto-denúncias, memes, gifs, anúncios publicitários e propagandas publicados em jornais, revistas, sites na internet etc.
(EF67LP09) Planejar notícia impressa e para circulação em outras mídias (rádio ou TV/vídeo), tendo em vista as condições de produção, do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. –, a partir da escolha do fato a ser noticiado (de relevância para a turma, escola ou comunidade), do levantamento de dados e informações sobre o fato – que pode envolver entrevistas com envolvidos ou com especialistas, consultas a fontes, análise de documentos, cobertura de eventos etc.–, do registro dessas informações e dados, da escolha de fotos ou imagens a produzir ou a utilizar etc. e a previsão de uma estrutura hipertextual (no caso de publicação em sites ou blogs noticiosos).
(EF67LP10) Produzir notícia impressa tendo em vista características do gênero – título ou manchete com verbo no tempo presente, linha fina (opcional), lide, progressão dada pela ordem decrescente de importância dos fatos, uso de 3ª pessoa, de palavras que indicam precisão –, e o estabelecimento adequado de coesão e produzir notícia para TV, rádio e internet, tendo em vista, além das características do gênero, os recursos de mídias disponíveis e o manejo de recursos de captação e edição de áudio e imagem.
(EF67LP11) Planejar resenhas, vlogs, vídeos e podcasts variados, e textos e vídeos de apresentação e apreciação próprios das culturas juvenis (algumas possibilidades: fanzines, fanclipes, e-zines, gameplay, detonado etc.), dentre outros, tendo em vista as condições de produção do texto – objetivo, leitores/espectadores, veículos e mídia de circulação etc. –, a partir da escolha de uma produção ou evento cultural para analisar – livro, filme, série, game, canção, videoclipe, fanclipe, show, saraus, slams etc. – da busca de informação sobre a produção ou evento escolhido, da síntese de informações sobre a obra/evento e do elenco/seleção de aspectos, elementos ou recursos que possam ser destacados positiva ou negativamente ou da roteirização do passo a passo do game para posterior gravação dos vídeos.
(EF67LP12) Produzir resenhas críticas, vlogs, vídeos, podcasts variados e produções e gêneros próprios das culturas juvenis (algumas possibilidades: fanzines, fanclipes, e-zines, gameplay, detonado etc.), que apresentem/descrevam e/ou avaliem produções culturais (livro, filme, série, game, canção, disco, videoclipe etc.) ou evento (show, sarau, slam etc.), tendo em vista o contexto de produção dado, as características do gênero, os recursos das mídias envolvidas e a textualização adequada dos textos e/ou produções.
(EF67LP13) Produzir, revisar e editar textos publicitários, levando em conta o contexto de produção dado, explorando recursos multissemióticos, relacionando elementos verbais e visuais, utilizando adequadamente estratégias discursivas de persuasão e/ou convencimento e criando título ou slogan que façam o leitor motivar-se a interagir com o texto produzido e se sinta atraído pelo serviço, ideia ou produto em questão.
(EF67LP14) Definir o contexto de produção da entrevista (objetivos, o que se pretende conseguir, porque aquele entrevistado etc.), levantar informações sobre o entrevistado e sobre o acontecimento ou tema em questão, preparar o roteiro de perguntar e realizar entrevista oral com envolvidos ou especialistas relacionados com o fato noticiado ou com o tema em pauta, usando roteiro previamente elaborado e formulando outras perguntas a partir das respostas dadas e, quando for o caso, selecionar partes, transcrever e proceder a uma edição escrita do texto, adequando-o a seu contexto de publicação, à construção composicional do gênero e garantindo a relevância das informações mantidas e a continuidade temática.
(EF67LP15) Identificar a proibição imposta ou o direito garantido, bem como as circunstâncias de sua aplicação, em artigos relativos a normas, regimentos escolares, regimentos e estatutos da sociedade civil, regulamentações para o mercado publicitário, Código de Defesa do Consumidor, Código Nacional de Trânsito, ECA, Constituição, dentre outros.
(EF67LP16) Explorar e analisar espaços de reclamação de direitos e de envio de solicitações (tais como ouvidorias, SAC, canais ligados a órgãos públicos, plataformas do consumidor, plataformas de reclamação), bem como de textos pertencentes a gêneros que circulam nesses espaços, reclamação ou carta de reclamação, solicitação ou carta de solicitação, como forma de ampliar as possibilidades de produção desses textos em casos que remetam a reivindicações que envolvam a escola, a comunidade ou algum de seus membros como forma de se engajar na busca de solução de problemas pessoais, dos outros e coletivos.
(EF67LP17) Analisar, a partir do contexto de produção, a forma de organização das cartas de solicitação e de reclamação (datação, forma de início, apresentação contextualizada do pedido ou da reclamação, em geral, acompanhada de explicações, argumentos e/ou relatos do problema, fórmula de finalização mais ou menos cordata, dependendo do tipo de carta e subscrição) e algumas das marcas linguísticas relacionadas à argumentação, explicação ou relato de fatos, como forma de possibilitar a escrita fundamentada de cartas como essas ou de postagens em canais próprios de reclamações e solicitações em situações que envolvam questões relativas à escola, à comunidade ou a algum dos seus membros.
(EF67LP18) Identificar o objeto da reclamação e/ou da solicitação e sua sustentação, explicação ou justificativa, de forma a poder analisar a pertinência da solicitação ou justificação.
(EF67LP19) Realizar levantamento de questões, problemas que requeiram a denúncia de desrespeito a direitos, reivindicações, reclamações, solicitações que contemplem a comunidade escolar ou algum de seus membros e examinar normas e legislações.
(EF67LP20) Realizar pesquisa, a partir de recortes e questões definidos previamente, usando fontes indicadas e abertas.
(EF67LP21) Divulgar resultados de pesquisas por meio de apresentações orais, painéis, artigos de divulgação científica, verbetes de enciclopédia, podcasts científicos etc.
(EF67LP22) Produzir resumos, a partir das notas e/ou esquemas feitos, com o uso adequado de paráfrases e citações.
(EF67LP23) Respeitar os turnos de fala, na participação em conversações e em discussões ou atividades coletivas, na sala de aula e na escola e formular perguntas coerentes e adequadas em momentos oportunos em situações de aulas, apresentação oral, seminário etc.
(EF67LP24) Tomar nota de aulas, apresentações orais, entrevistas (ao vivo, áudio, TV, vídeo), identificando e hierarquizando as informações principais, tendo em vista apoiar o estudo e a produção de sínteses e reflexões pessoais ou outros objetivos em questão.
(EF67LP25) Reconhecer e utilizar os critérios de organização tópica (do geral para o específico, do específico para o geral etc.), as marcas linguísticas dessa organização (marcadores de ordenação e enumeração, de explicação, definição e exemplificação, por exemplo) e os mecanismos de paráfrase, de maneira a organizar mais adequadamente a coesão e a progressão temática de seus textos.
(EF67LP26) Reconhecer a estrutura de hipertexto em textos de divulgação científica e proceder à remissão a conceitos e relações por meio de notas de rodapés ou boxes.
(EF67LP27) Analisar, entre os textos literários e entre estes e outras manifestações artísticas (como cinema, teatro, música, artes visuais e midiáticas), referências explícitas ou implícitas a outros textos, quanto aos temas, personagens e recursos literários e semióticos.
(EF67LP28) Ler, de forma autônoma, e compreender – selecionando procedimentos e estratégias de leitura adequados a diferentes objetivos e levando em conta características dos gêneros e suportes –, romances infantojuvenis, contos populares, contos de terror, lendas brasileiras, indígenas e africanas, narrativas de aventuras, narrativas de enigma, mitos, crônicas, autobiografias, histórias em quadrinhos, mangás, poemas de forma livre e fixa (como sonetos e cordéis), vídeo-poemas, poemas visuais, dentre outros, expressando avaliação sobre o texto lido e estabelecendo preferências por gêneros, temas, autores.
(EF67LP29) Identificar, em texto dramático, personagem, ato, cena, fala e indicações cênicas e a organização do texto: enredo, conflitos, ideias principais, pontos de vista, universos de referência.
(EF67LP30) Criar narrativas ficcionais, tais como contos populares, contos de suspense, mistério, terror, humor, narrativas de enigma, crônicas, histórias em quadrinhos, dentre outros, que utilizem cenários e personagens realistas ou de fantasia, observando os elementos da estrutura narrativa próprios ao gênero pretendido, tais como enredo, personagens, tempo, espaço e narrador, utilizando tempos verbais adequados à narração de fatos passados, empregando conhecimentos sobre diferentes modos de se iniciar uma história e de inserir os discursos direto e indireto.
(EF67LP31) Criar poemas compostos por versos livres e de forma fixa (como quadras e sonetos), utilizando recursos visuais, semânticos e sonoros, tais como cadências, ritmos e rimas, e poemas visuais e vídeo-poemas, explorando as relações entre imagem e texto verbal, a distribuição da mancha gráfica (poema visual) e outros recursos visuais e sonoros.
(EF67LP32) Escrever palavras com correção ortográfica, obedecendo as convenções da língua escrita.
(EF67LP33) Pontuar textos adequadamente.
(EF67LP34) Formar antônimos com acréscimo de prefixos que expressam noção de negação.
(EF67LP35) Distinguir palavras derivadas por acréscimo de afixos e palavras compostas.
(EF67LP36) Utilizar, ao produzir texto, recursos de coesão referencial (léxica e pronominal) e sequencial e outros recursos expressivos adequados ao gênero textual.
(EF67LP37) Analisar, em diferentes textos, os efeitos de sentido decorrentes do uso de recursos linguístico-discursivos de prescrição, causalidade, sequências descritivas e expositivas e ordenação de eventos.
(EF67LP38) Analisar os efeitos de sentido do uso de figuras de linguagem, como comparação, metáfora, metonímia, personificação, hipérbole, dentre outras.
`;

async function parseAndInsert() {
    const regex = /\((EF67LP\d{2})\)\s*([\s\S]*?)(?=(?:\(EF67LP\d{2}\)|\n$|$))/g;

    let match;
    const skillsToInsert = [];

    while ((match = regex.exec(rawText)) !== null) {
        const code = match[1].trim();
        let description = match[2].trim();

        // Clean up newlines to form a single continuous paragraph
        description = description.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');

        skillsToInsert.push({
            code: code,
            description: description,
            subject: "LÍNGUA PORTUGUESA", // Baseado no código LP
            year_range: "EF67" // A barra de pesquisa puxa as faixas de anos usando o 'EF67' entre os ranges
        });
    }

    console.log(`Extracted ${skillsToInsert.length} skills. First 2:`);
    console.log(skillsToInsert.slice(0, 2));

    if (skillsToInsert.length === 0) {
        console.log("No skills matched the pattern.");
        return;
    }

    console.log("Inserting into Supabase 'bncc_skills'...");
    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log(`Successfully inserted/updated ${result ? result.length : 'unknown'} skills!`);
    }
}

parseAndInsert();
