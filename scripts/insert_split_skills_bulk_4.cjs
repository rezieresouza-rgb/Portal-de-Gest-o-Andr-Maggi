const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP20 | Reconstrução das condições de produção e circulação e adequação do texto à construção composicional e ao estilo de gênero (Lei, código, estatuto, código, regimento etc.) | Identificar, tendo em vista o contexto de produção, a forma de organização dos textos normativos e legais, a lógica de hierarquização de seus itens e subitens e suas partes: parte inicial (título – nome e data – e ementa), blocos de artigos (parte, livro, capítulo, seção, subseção), artigos (caput e parágrafos e incisos) e parte final (disposições pertinentes à sua implementação) e analisar efeitos de sentido causados pelo uso de vocabulário técnico, pelo uso do imperativo, de palavras e expressões que indicam circunstâncias, como advérbios e locuções adverbiais, de palavras que indicam generalidade, como alguns pronomes indefinidos, de forma a poder compreender o caráter imperativo, coercitivo e generalista das leis e de outras formas de regulamentação.
EF69LP21 | Apreciação e réplica | Posicionar-se em relação a conteúdos veiculados em práticas não institucionalizadas de participação social, sobretudo àquelas vinculadas a manifestações artísticas, produções culturais, intervenções urbanas e práticas próprias das culturas juvenis que pretendam denunciar, expor uma problemática ou “convocar” para uma reflexão/ação, relacionando esse texto/produção com seu contexto de produção e relacionando as partes e semioses presentes para a construção de sentidos.
EF69LP22 | Textualização, revisão e edição | Produzir, revisar e editar textos reivindicatórios ou propositivos sobre problemas que afetam a vida escolar ou da comunidade, justificando pontos de vista, reivindicações e detalhando propostas (justificativa, objetivos, ações previstas etc.), levando em conta seu contexto de produção e as características dos gêneros em questão.
EF69LP23 | Textualização, revisão e edição | Contribuir com a escrita de textos normativos, quando houver esse tipo de demanda na escola – regimentos e estatutos de organizações da sociedade civil do âmbito da atuação das crianças e jovens (grêmio livre, clubes de leitura, associações culturais etc.) – e de regras e regulamentos nos vários âmbitos da escola – campeonatos, festivais, regras de convivência etc., levando em conta o contexto de produção e as características dos gêneros em questão.
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
