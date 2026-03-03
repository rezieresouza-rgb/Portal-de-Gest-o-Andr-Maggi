const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP12 | Planejamento e produção de textos jornalísticos orais | Desenvolver estratégias de planejamento, elaboração, revisão, edição, reescrita/redesign (esses três últimos quando não for a situação ao vivo) e avaliação de textos orais, áudio e/ou vídeo, considerando sua adequação aos contextos em que foram produzidos, à forma composicional e estilo de gêneros, a clareza, progressão temática e variedade linguística empregada, os elementos relacionados à fala, tais como modulação de voz, entonação, ritmo, altura e intensidade, respiração etc., os elementos cinésicos, tais como postura corporal, movimentos e gestualidade significativa, expressão facial, contato de olho com plateia etc.
EF69LP13 | Participação em discussões orais de temas controversos de interesse da turma e/ou de relevância social | Engajar-se e contribuir com a busca de conclusões comuns relativas a problemas, temas ou questões polêmicas de interesse da turma e/ou de relevância social.
EF69LP14 | Participação em discussões orais de temas controversos de interesse da turma e/ou de relevância social | Formular perguntas e decompor, com a ajuda dos colegas e dos professores, tema/questão polêmica, explicações e ou argumentos relativos ao objeto de discussão para análise mais minuciosa e buscar em fontes diversas informações ou dados que permitam analisar partes da questão e compartilhá-los com a turma.
EF69LP15 | Participação em discussões orais de temas controversos de interesse da turma e/ou de relevância social | Apresentar argumentos e contra-argumentos coerentes, respeitando os turnos de fala, na participação em discussões sobre temas controversos e/ou polêmicos.
EF69LP16 | Construção composicional | Analisar e utilizar as formas de composição dos gêneros jornalísticos da ordem do relatar, tais como notícias (pirâmide invertida no impresso X blocos noticiosos hipertextuais e hipermidiáticos no digital, que também pode contar com imagens de vários tipos, vídeos, gravações de áudio etc.), da ordem do argumentar, tais como artigos de opinião e editorial (contextualização, defesa de tese/opinião e uso de argumentos) e das entrevistas: apresentação e contextualização do entrevistado e do tema, estrutura pergunta e resposta etc.
EF69LP17 | Estilo | Perceber e analisar os recursos estilísticos e semióticos dos gêneros jornalísticos e publicitários, os aspectos relativos ao tratamento da informação em notícias, como a ordenação dos eventos, as escolhas lexicais, o efeito de imparcialidade do relato, a morfologia do verbo, em textos noticiosos e argumentativos, reconhecendo marcas de pessoa, número, tempo, modo, a distribuição dos verbos nos gêneros textuais (por exemplo, as formas de pretérito em relatos; as formas de presente e futuro em gêneros argumentativos; as formas de imperativo em gêneros publicitários), o uso de recursos persuasivos em textos argumentativos diversos (como a elaboração do título, escolhas lexicais, construções metafóricas, a explicitação ou a ocultação de fontes de informação) e as estratégias de persuasão e apelo ao consumo com os recursos linguístico-discursivos utilizados (tempo verbal, jogos de palavras, metáforas, imagens).
EF69LP18 | Estilo | Utilizar, na escrita/reescrita de textos argumentativos, recursos linguísticos que marquem as relações de sentido entre parágrafos e enunciados do texto e operadores de conexão adequados aos tipos de argumento e à forma de composição de textos argumentativos, de maneira a garantir a coesão, a coerência e a progressão temática nesses textos (“primeiramente”, “mas”, “no entanto”, “em primeiro/segundo/terceiro lugar”, “finalmente”, “em conclusão” etc.).
EF69LP19 | Efeito de sentido | Analisar, em gêneros orais que envolvam argumentação, os efeitos de sentido de elementos típicos da modalidade falada, como a pausa, a entonação, o ritmo, a gestualidade e expressão facial, as hesitações etc.
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

            // Let's determine the year range from the code (e.g. EF69LP01 -> EF69)
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
