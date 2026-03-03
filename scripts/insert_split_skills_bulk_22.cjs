const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP17 | Reconstrução do contexto de produção, circulação e recepção de textos legais e normativos | Relacionar textos e documentos legais e normativos de importância universal, nacional ou local que envolvam direitos, em especial, de crianças, adolescentes e jovens – tais como a Declaração dos Direitos Humanos, a Constituição Brasileira, o ECA – e a regulamentação da organização escolar – por exemplo, regimento escolar –, a seus contextos de produção, reconhecendo e analisando possíveis motivações, finalidades e sua vinculação com experiências humanas e fatos históricos e sociais, como forma de ampliar a compreensão dos direitos e deveres, de fomentar os princípios democráticos e uma atuação da ética da responsabilidade (o outro tem direito a uma vida digna tanto quanto eu tenho).
EF89LP18 | Contexto de produção, circulação e recepção de textos e práticas relacionadas à defesa de direitos e à participação social | Explorar e analisar instâncias e canais de participação disponíveis na escola (conselho de escola, outros colegiados, grêmio livre), na comunidade (associações, coletivos, movimentos etc.), no município e no país, incluindo formas de participação digital, como canais e plataformas de participação (como portal e-cidadania), serviços, portais e ferramentas de acompanhamento do trabalho de políticos e de tramitação de leis, canais de educação política, bem como de propostas e proposições que circulam nesses canais, de forma a participar do debate de ideias e propostas na esfera social e a engajar-se com a busca de soluções para problemas ou questões que envolvam a vida de escola e da comunidade.
EF89LP19 | Relação entre contexto de produção e características composicionais e estilísticas dos gêneros. Apreciação e réplica | Analisar, a partir do contexto de produção, a forma de organização das cartas abertas, abaixo-assinados e petições on-line (identificação dos signatários, explicitação da reivindicação feita, acompanhada ou não de uma breve apresentação da problemática e/ou de justificativas que visam sustentar a reivindicação) e a proposição, discussão e avaliação de propostas políticas ou de soluções para problemas de interesse público, apresentadas ou lidas nos canais digitais de participação, identificando suas marcas linguísticas, como forma de possibilitar a escrita ou subscrição consciente de abaixo-assinados e textos dessa natureza e poder se posicionar de forma crítica e fundamentada frente às propostas.
EF89LP20 | Estratégias e procedimentos de leitura em textos reivindicatórios ou propositivos | Comparar propostas políticas e de solução de problemas, identificando o que se pretende fazer/implementar, por que (motivações, justificativas), para que (objetivos, benefícios e consequências esperados), como (ações, passos), quais os custos, a fim de avaliar a eficácia da proposta/solução, contrastando dados e informações de diferentes fontes, identificando coincidências, divergências e complementaridades de informações, de forma a poder compreender e posicionar-se criticamente sobre os dados e informações usados em fundamentação de propostas e analisar a coerência entre os elementos, de forma a tomar decisões fundamentadas.
EF89LP21 | Estratégia de produção: planejamento de textos reivindicatórios ou propositivos | Realizar enquetes e pesquisas de opinião, de forma a levantar prioridades, problemas a resolver ou propostas que possam contribuir para melhoria da escola ou da comunidade, caracterizar demanda/necessidade, documentando-a de diferentes maneiras por meio de diferentes procedimentos, gêneros e mídias e, quando for o caso, selecionar informações e dados relevantes de fontes pertinentes e diversas (sites, imagens, vídeos etc.), avaliando a qualidade e a utilidade dessas fontes, que possam servir de contextualização e fundamentação de propostas, de forma a justificar a proposição de propostas, projetos culturais e ações de intervenção.
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
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF00";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;
            skillsToInsert.push({ code, description: fullDescription, subject: "LÍNGUA PORTUGUESA", year_range });
        }
    }

    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");

    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}

importSkills();
