const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67LP14 | Planejamento e produção de entrevistas orais | Definir o contexto de produção da entrevista (objetivos, o que se pretende conseguir, porque aquele entrevistado etc.), levantar informações sobre o entrevistado e sobre o acontecimento ou tema em questão, preparar o roteiro de perguntar e realizar entrevista oral com envolvidos ou especialistas relacionados com o fato noticiado ou com o tema em pauta, usando roteiro previamente elaborado e formulando outras perguntas a partir das respostas dadas e, quando for o caso, selecionar partes, transcrever e proceder a uma edição escrita do texto, adequando-o a seu contexto de publicação, à construção composicional do gênero e garantindo a relevância das informações mantidas e a continuidade temática.
EF67LP15 | Estratégias e procedimentos de leitura em textos legais e normativos | Identificar a proibição imposta ou o direito garantido, bem como as circunstâncias de sua aplicação, em artigos relativos a normas, regimentos escolares, regimentos e estatutos da sociedade civil, regulamentações para o mercado publicitário, Código de Defesa do Consumidor, Código Nacional de Trânsito, ECA, Constituição, dentre outros.
EF67LP16 | Contexto de produção, circulação e recepção de textos e práticas relacionadas à defesa de direitos e à participação social | Explorar e analisar espaços de reclamação de direitos e de envio de solicitações (tais como ouvidorias, SAC, canais ligados a órgãos públicos, plataformas do consumidor, plataformas de reclamação), bem como de textos pertencentes a gêneros que circulam nesses espaços, reclamação ou carta de reclamação, solicitação ou carta de solicitação, como forma de ampliar as possibilidades de produção desses textos em casos que remetam a reivindicações que envolvam a escola, a comunidade ou algum de seus membros como forma de se engajar na busca de solução de problemas pessoais, dos outros e coletivos.
EF67LP17 | Relação entre contexto de produção e características composicionais e estilísticas dos gêneros (carta de solicitação, carta de reclamação, petição on-line, carta aberta, abaixo-assinado, proposta etc.). Apreciação e réplica | Analisar, a partir do contexto de produção, a forma de organização das cartas de solicitação e de reclamação (datação, forma de início, apresentação contextualizada do pedido ou da reclamação, em geral, acompanhada de explicações, argumentos e/ou relatos do problema, fórmula de finalização mais ou menos cordata, dependendo do tipo de carta e subscrição) e algumas das marcas linguísticas relacionadas à argumentação, explicação ou relato de fatos, como forma de possibilitar a escrita fundamentada de cartas como essas ou de postagens em canais próprios de reclamações e solicitações em situações que envolvam questões relativas à escola, à comunidade ou a algum dos seus membros.
EF67LP18 | Estratégias, procedimentos de leitura em textos reivindicatórios ou propositivos | Identificar o objeto da reclamação e/ou da solicitação e sua sustentação, explicação ou justificativa, de forma a poder analisar a pertinência da solicitação ou justificação.
EF67LP19 | Estratégias de produção: planejamento de textos reivindicatórios ou propositivos | Realizar levantamento de questões, problemas que requeiram a denúncia de desrespeito a direitos, reivindicações, reclamações, solicitações que contemplem a comunidade escolar ou algum de seus membros e examinar normas e legislações.
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
