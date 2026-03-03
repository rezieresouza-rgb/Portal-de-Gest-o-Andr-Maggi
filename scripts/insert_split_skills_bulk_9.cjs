const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP44 | Reconstrução das condições de produção, circulação e recepção. Apreciação e réplica | Inferir a presença de valores sociais, culturais e humanos e de diferentes visões de mundo, em textos literários, reconhecendo nesses textos formas de estabelecer múltiplos olhares sobre as identidades, sociedades e culturas e considerando a autoria e o contexto social e histórico de sua produção.
EF69LP45 | Reconstrução das condições de produção, circulação e recepção. Apreciação e réplica | Posicionar-se criticamente em relação a textos pertencentes a gêneros como quarta-capa, programa (de teatro, dança, exposição etc.), sinopse, resenha crítica, comentário em blog/vlog cultural etc., para selecionar obras literárias e outras manifestações artísticas (cinema, teatro, exposições, espetáculos, CD’s, DVD’s etc.), diferenciando as sequências descritivas e avaliativas e reconhecendo-os como gêneros que apoiam a escolha do livro ou produção cultural e consultando-os no momento de fazer escolhas, quando for o caso.
EF69LP46 | Reconstrução das condições de produção, circulação e recepção. Apreciação e réplica | Participar de práticas de compartilhamento de leitura/recepção de obras literárias/manifestações artísticas, como rodas de leitura, clubes de leitura, eventos de contação de histórias, de leituras dramáticas, de apresentações teatrais, musicais e de filmes, cineclubes, festivais de vídeo, saraus, slams, canais de booktubers, redes sociais temáticas (de leitores, de cinéfilos, de música etc.), dentre outros, tecendo, quando possível, comentários de ordem estética e afetiva e justificando suas apreciações, escrevendo comentários e resenhas para jornais, blogs e redes sociais e utilizando formas de expressão das culturas juvenis, tais como, vlogs e podcasts culturais (literatura, cinema, teatro, música), playlists comentadas, fanfics, fanzines, e-zines, fã-vídeos, fanclipes, posts em fanpages, trailer honesto, vídeo-minuto, dentre outras possibilidades de práticas de apreciação e de manifestação da cultura de fãs.
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
