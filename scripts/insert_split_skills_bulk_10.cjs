const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP47 | Reconstrução da textualidade e compreensão dos efeitos de sentidos provocados pelos usos de recursos linguísticos e multissemióticos | Analisar, em textos narrativos ficcionais, as diferentes formas de composição próprias de cada gênero, os recursos coesivos que constroem a passagem do tempo e articulam suas partes, a escolha lexical típica de cada gênero para a caracterização dos cenários e dos personagens e os efeitos de sentido decorrentes dos tempos verbais, dos tipos de discurso, dos verbos de enunciação e das variedades linguísticas (no discurso direto, se houver) empregados, identificando o enredo e o foco narrativo e percebendo como se estrutura a narrativa nos diferentes gêneros e os efeitos de sentido decorrentes do foco narrativo típico de cada gênero, da caracterização dos espaços físico e psicológico e dos tempos cronológico e psicológico, das diferentes vozes no texto (do narrador, de personagens em discurso direto e indireto), do uso de pontuação expressiva, palavras e expressões conotativas e processos figurativos e do uso de recursos linguístico-gramaticais próprios a cada gênero narrativo.
EF69LP48 | Reconstrução da textualidade e compreensão dos efeitos de sentidos provocados pelos usos de recursos linguísticos e multissemióticos | Interpretar, em poemas, efeitos produzidos pelo uso de recursos expressivos sonoros (estrofação, rimas, aliterações etc), semânticos (figuras de linguagem, por exemplo), gráfico-espacial (distribuição da mancha gráfica no papel), imagens e sua relação com o texto verbal.
EF69LP49 | Adesão às práticas de leitura | Mostrar-se interessado e envolvido pela leitura de livros de literatura e por outras produções culturais do campo e receptivo a textos que rompam com seu universo de expectativas, que representem um desafio em relação às suas possibilidades atuais e suas experiências anteriores de leitura, apoiando-se nas marcas linguísticas, em seu conhecimento sobre os gêneros e a temática e nas orientações dadas pelo professor.
EF69LP50 | Relação entre textos | Elaborar texto teatral, a partir da adaptação de romances, contos, mitos, narrativas de enigma e de aventura, novelas, biografias romanceadas, crônicas, dentre outros, indicando as rubricas para caracterização do cenário, do espaço, do tempo; explicitando a caracterização física e psicológica dos personagens e dos seus modos de ação; reconfigurando a inserção do discurso direto e dos tipos de narrador; explicitando as marcas de variação linguística (dialetos, registros e jargões) e retextualizando o tratamento da temática.
EF69LP51 | Consideração das condições de produção. Estratégias de produção: planejamento, textualização e revisão/edição | Engajar-se ativamente nos processos de planejamento, textualização, revisão/edição e reescrita, tendo em vista as restrições temáticas, composicionais e estilísticas dos textos pretendidos e as configurações da situação de produção – o leitor pretendido, o suporte, o contexto de circulação do texto, as finalidades etc. – e considerando a imaginação, a estesia e a verossimilhança próprias ao texto literário.
EF69LP52 | Produção de textos orais | Representar cenas ou textos dramáticos, considerando, na caracterização dos personagens, os aspectos linguísticos e paralinguísticos das falas (timbre e tom de voz, pausas e hesitações, entonação e expressividade, variedades e registros linguísticos), os gestos e os deslocamentos no espaço cênico, o figurino e a maquiagem e elaborando as rubricas indicadas pelo autor por meio do cenário, da trilha sonora e da exploração dos modos de interpretação.
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
