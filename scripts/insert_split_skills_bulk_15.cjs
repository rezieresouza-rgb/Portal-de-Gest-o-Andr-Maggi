const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67LP20 | Curadoria de informação | Realizar pesquisa, a partir de recortes e questões definidos previamente, usando fontes indicadas e abertas.
EF67LP21 | Estratégias de escrita: textualização, revisão e edição | Divulgar resultados de pesquisas por meio de apresentações orais, painéis, artigos de divulgação científica, verbetes de enciclopédia, podcasts científicos etc.
EF67LP22 | Estratégias de escrita: textualização, revisão e edição | Produzir resumos, a partir das notas e/ou esquemas feitos, com o uso adequado de paráfrases e citações.
EF67LP23 | Conversação espontânea | Respeitar os turnos de fala, na participação em conversações e em discussões ou atividades coletivas, na sala de aula e na escola e formular perguntas coerentes e adequadas em momentos oportunos em situações de aulas, apresentação oral, seminário etc.
EF67LP24 | Procedimentos de apoio à compreensão. Tomada de nota | Tomar nota de aulas, apresentações orais, entrevistas (ao vivo, áudio, TV, vídeo), identificando e hierarquizando as informações principais, tendo em vista apoiar o estudo e a produção de sínteses e reflexões pessoais ou outros objetivos em questão.
EF67LP25 | Textualização. Progressão temática | Reconhecer e utilizar os critérios de organização tópica (do geral para o específico, do específico para o geral etc.), as marcas linguísticas dessa organização (marcadores de ordenação e enumeração, de explicação, definição e exemplificação, por exemplo) e os mecanismos de paráfrase, de maneira a organizar mais adequadamente a coesão e a progressão temática de seus textos.
EF67LP26 | Textualização | Reconhecer a estrutura de hipertexto em textos de divulgação científica e proceder à remissão a conceitos e relações por meio de notas de rodapés ou boxes.
EF67LP27 | Relação entre textos | Analisar, entre os textos literários e entre estes e outras manifestações artísticas (como cinema, teatro, música, artes visuais e midiáticas), referências explícitas ou implícitas a outros textos, quanto aos temas, personagens e recursos literários e semióticos.
EF67LP28 | Estratégias de leitura. Apreciação e réplica | Ler, de forma autônoma, e compreender – selecionando procedimentos e estratégias de leitura adequados a diferentes objetivos e levando em conta características dos gêneros e suportes –, romances infantojuvenis, contos populares, contos de terror, lendas brasileiras, indígenas e africanas, narrativas de aventuras, narrativas de enigma, mitos, crônicas, autobiografias, histórias em quadrinhos, mangás, poemas de forma livre e fixa (como sonetos e cordéis), vídeo-poemas, poemas visuais, dentre outros, expressando avaliação sobre o texto lido e estabelecendo preferências por gêneros, temas, autores.
EF67LP29 | Reconstrução da textualidade. Efeitos de sentidos provocados pelos usos de recursos linguísticos e multissemióticos | Identificar, em texto dramático, personagem, ato, cena, fala e indicações cênicas e a organização do texto: enredo, conflitos, ideias principais, pontos de vista, universos de referência.
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
