const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP06 | Relação do texto com o contexto de produção e experimentação de papéis sociais | Produzir e publicar notícias, fotodenúncias, fotorreportagens, reportagens, reportagens multimidiáticas, infográficos, podcasts noticiosos, entrevistas, cartas de leitor, comentários, artigos de opinião de interesse local ou global, textos de apresentação e apreciação de produção cultural – resenhas e outros próprios das formas de expressão das culturas juvenis, tais como vlogs e podcasts culturais, gameplay, detonado etc. – e cartazes, anúncios, propagandas, spots, jingles de campanhas sociais, dentre outros em várias mídias, vivenciando de forma significativa o papel de repórter, de comentador, de analista, de crítico, de editor ou articulista, de booktuber, de vlogger (vlogueiro) etc., como forma de compreender as condições de produção que envolvem a circulação desses textos e poder participar e vislumbrar possibilidades de participação nas práticas de linguagem do campo jornalístico e do campo midiático de forma ética e responsável, levando-se em consideração o contexto da Web 2.0, que amplia a possibilidade de circulação desses textos e "funde" os papéis de leitor e autor, de consumidor e produtor.
EF69LP07 | Textualização | Produzir textos em diferentes gêneros, considerando sua adequação ao contexto produção e circulação – os enunciadores envolvidos, os objetivos, o gênero, o suporte, a circulação -, ao modo (escrito ou oral; imagem estática ou em movimento etc.), à variedade linguística e/ou semiótica apropriada a esse contexto, à construção da textualidade relacionada às propriedades textuais e do gênero), utilizando estratégias de planejamento, elaboração, revisão, edição, reescrita/redesign e avaliação de textos, para, com a ajuda do professor e a colaboração dos colegas, corrigir e aprimorar as produções realizadas, fazendo cortes, acréscimos, reformulações, correções de concordância, ortografia, pontuação em textos e editando imagens, arquivos sonoros, fazendo cortes, acréscimos, ajustes, acrescentando/alterando efeitos, ordenamentos etc.
EF69LP08 | Revisão/edição de texto informativo e opinativo | Revisar/editar o texto produzido – notícia, reportagem, resenha, artigo de opinião, dentre outros -, tendo em vista sua adequação ao contexto de produção, a mídia em questão, características do gênero, aspectos relativos à textualidade, a relação entre as diferentes semioses, a formatação e uso adequado das ferramentas de edição (de texto, foto, áudio e vídeo, dependendo do caso) e adequação à norma culta.
EF69LP09 | Planejamento de textos de peças publicitárias de campanhas sociais | Planejar uma campanha publicitária sobre questões/problemas, temas, causas significativas para a escola e/ou comunidade, a partir de um levantamento de material sobre o tema ou evento, da definição do público-alvo, do texto ou peça a ser produzido – cartaz, banner, folheto, panfleto, anúncio impresso e para a internet, spot, propaganda de rádio, TV etc. -, da ferramenta de edição de texto, áudio ou vídeo que será utilizada, do recorte e enfoque a ser dado, das estratégias de persuasão que serão utilizadas etc.
EF69LP10 | Produção de textos jornalísticos orais | Produzir notícias para rádios, TV ou vídeos, podcasts noticiosos e de opinião, entrevistas, comentários, vlogs, jornais radiofônicos e televisivos, dentre outros possíveis, relativos a fato e temas de interesse pessoal, local ou global e textos orais de apreciação e opinião – podcasts e vlogs noticiosos, culturais e de opinião, orientando-se por roteiro ou texto, considerando o contexto de produção e demonstrando domínio dos gêneros.
EF69LP11 | Produção de textos jornalísticos orais | Identificar e analisar posicionamentos defendidos e refutados na escuta de interações polêmicas em entrevistas, discussões e debates (televisivo, em sala de aula, em redes sociais etc.), entre outros, e se posicionar frente a eles.
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
