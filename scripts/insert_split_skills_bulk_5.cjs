const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP24 | Discussão oral | Discutir casos, reais ou simulações, submetidos a juízo, que envolvam (supostos) desrespeitos a artigos, do ECA, do Código de Defesa do Consumidor, do Código Nacional de Trânsito, de regulamentações do mercado publicitário etc., como forma de criar familiaridade com textos legais - seu vocabulário, formas de organização, marcas de estilo etc. -, de maneira a facilitar a compreensão de leis, fortalecer a defesa de direitos, fomentar a escrita de textos normativos (se e quando isso for necessário) e possibilitar a compreensão do caráter interpretativo das leis e as várias perspectivas que podem estar em jogo.
EF69LP25 | Discussão oral | Posicionar-se de forma consistente e sustentada em uma discussão, assembleia, reuniões de colegiados da escola, de agremiações e outras situações de apresentação de propostas e defesas de opiniões, respeitando as opiniões contrárias e propostas alternativas e fundamentando seus posicionamentos, no tempo de fala previsto, valendo-se de sínteses e propostas claras e justificadas.
EF69LP26 | Registro | Tomar nota em discussões, debates, palestras, apresentação de propostas, reuniões, como forma de documentar o evento e apoiar a própria fala (que pode se dar no momento do evento ou posteriormente, quando, por exemplo, for necessária a retomada dos assuntos tratados em outros contextos públicos, como diante dos representados).
EF69LP27 | Análise de textos legais/normativos, propositivos e reivindicatórios | Analisar a forma composicional de textos pertencentes a gêneros normativos/jurídicos e a gêneros da esfera política, tais como propostas, programas políticos (posicionamento quanto a diferentes ações a serem propostas, objetivos, ações previstas etc.), propaganda política (propostas e sua sustentação, posicionamento quanto a temas em discussão) e textos reivindicatórios: cartas de reclamação, petição (proposta, suas justificativas e ações a serem adotadas) e suas marcas linguísticas, de forma a incrementar a compreensão de textos pertencentes a esses gêneros e a possibilitar a produção de textos mais adequados e/ou fundamentados quando isso for requerido.
EF69LP28 | Modalização | Observar os mecanismos de modalização adequados aos textos jurídicos, as modalidades deônticas, que se referem ao eixo da conduta (obrigatoriedade/permissibilidade) como, por exemplo: Proibição: “Não se deve fumar em recintos fechados.”; Obrigatoriedade: “A vida tem que valer a pena.”; Possibilidade: “É permitido a entrada de menores acompanhados de adultos responsáveis”, e os mecanismos de modalização adequados aos textos políticos e propositivos, as modalidades apreciativas, em que o locutor exprime um juízo de valor (positivo ou negativo) acerca do que enuncia. Por exemplo: “Que belo discurso!”, “Discordo das escolhas de Antônio.” “Felizmente, o buraco ainda não causou acidentes mais graves.”
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
                description: `[Objeto de Conhecimento: ${knowledgeObject}] ${description} `,
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
        console.log(`Sucesso! Foram inseridas / atualizadas ${result ? result.length : 0} habilidades no banco separadas corretamente!`);
    }
}

importSkills();
