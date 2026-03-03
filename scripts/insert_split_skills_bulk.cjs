const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP01 | Apreciação e réplica. Relação entre gêneros e mídias | Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia quando for o caso.
EF69LP02 | Apreciação e réplica. Relação entre gêneros e mídias | Analisar e comparar peças publicitárias variadas (cartazes, folhetos, outdoor, anúncios e propagandas em diferentes mídias, spots, jingle, vídeos etc.), de forma a perceber a articulação entre elas em campanhas, as especificidades das várias semioses e mídias, a adequação dessas peças ao público-alvo, aos objetivos do anunciante e/ou da campanha e à construção composicional e estilo dos gêneros em questão, como forma de ampliar suas possibilidades de compreensão (e produção) de textos pertencentes a esses gêneros.
EF69LP03 | Estratégia de leitura: apreender os sentidos globais do texto | Identificar, em notícias, o fato central, suas principais circunstâncias e eventuais decorrências; em reportagens e fotorreportagens o fato ou a temática retratada e a perspectiva de abordagem, em entrevistas os principais temas/subtemas abordados, explicações dadas ou teses defendidas em relação a esses subtemas; em tirinhas, memes, charge, a crítica, ironia ou humor presente.
EF69LP04 | Efeitos de sentido | Identificar e analisar os efeitos de sentido que fortalecem a persuasão nos textos publicitários, relacionando as estratégias de persuasão e apelo ao consumo com os recursos linguístico-discursivos utilizados, como imagens, tempo verbal, jogos de palavras, figuras de linguagem etc., com vistas a fomentar práticas de consumo conscientes.
EF69LP05 | Efeitos de sentido | Inferir e justificar, em textos multissemióticos – tirinhas, charges, memes, gifs etc. –, o efeito de humor, ironia e/ou crítica pelo uso ambíguo de palavras, expressões ou imagens ambíguas, de clichês, de recursos iconográficos, de pontuação etc.
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
            const description = parts.slice(2).join(' | '); // Handle cases where description might have pipes

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
