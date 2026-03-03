const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertNewFormat() {
    const mappings = [
        { code: 'EF69LP01', knowledgeObject: 'Apreciação e réplica. Relação entre gêneros e mídias', desc: 'Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia quando for o caso.' },
        { code: 'EF69LP02', knowledgeObject: 'Apreciação e réplica. Relação entre gêneros e mídias', desc: 'Analisar e comparar peças publicitárias variadas (cartazes, folhetos, outdoor, anúncios e propagandas em diferentes mídias, spots, jingle, vídeos etc.), de forma a perceber a articulação entre elas em campanhas, as especificidades das várias semioses e mídias, a adequação dessas peças ao público-alvo, aos objetivos do anunciante e/ou da campanha e à construção composicional e estilo dos gêneros em questão, como forma de ampliar suas possibilidades de compreensão (e produção) de textos pertencentes a esses gêneros.' },
        { code: 'EF69LP03', knowledgeObject: 'Estratégia de leitura: apreender os sentidos globais do texto', desc: 'Identificar, em notícias, o fato central, suas principais circunstâncias e eventuais decorrências; em reportagens e fotorreportagens o fato ou a temática retratada e a perspectiva de abordagem, em entrevistas os principais temas/subtemas abordados, explicações dadas ou teses defendidas em relação a esses subtemas; em tirinhas, memes, charge, a crítica, ironia ou humor presente.' },
        { code: 'EF69LP04', knowledgeObject: 'Efeitos de sentido', desc: 'Identificar e analisar os efeitos de sentido que fortalecem a persuasão nos textos publicitários, relacionando as estratégias de persuasão e apelo ao consumo com os recursos linguístico-discursivos utilizados, como imagens, tempo verbal, jogos de palavras, figuras de linguagem etc., com vistas a fomentar práticas de consumo conscientes.' },
        { code: 'EF69LP05', knowledgeObject: 'Efeitos de sentido', desc: 'Inferir e justificar, em textos multissemióticos – tirinhas, charges, memes, gifs etc. –, o efeito de humor, ironia e/ou crítica pelo uso ambíguo de palavras, expressões ou imagens ambíguas, de clichês, de recursos iconográficos, de pontuação etc.' }
    ];

    const skillsToInsert = mappings.map(m => ({
        code: m.code,
        description: `[Objeto de Conhecimento: ${m.knowledgeObject}] ${m.desc}`,
        subject: "LÍNGUA PORTUGUESA",
        year_range: "EF69"
    }));

    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log(`Successfully inserted/updated ${result ? result.length : 'unknown'} clean skills!`);
    }
}

insertNewFormat();
