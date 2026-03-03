const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP40 | Construção composicional. Elementos paralinguísticos e cinésicos. Apresentações orais | Analisar, em gravações de seminários, conferências rápidas, trechos de palestras, dentre outros, a construção composicional dos gêneros de apresentação – abertura/saudação, introdução ao tema, apresentação do plano de exposição, desenvolvimento dos conteúdos, por meio do encadeamento de temas e subtemas (coesão temática), síntese final e/ou conclusão, encerramento –, os elementos paralinguísticos (tais como: tom e volume da voz, pausas e hesitações – que, em geral, devem ser minimizadas –, modulação de voz e entonação, ritmo, respiração etc.) e cinésicos (tais como: postura corporal, movimentos e gestualidade significativa, expressão facial, contato de olho com plateia, modulação de voz e entonação, sincronia da fala com ferramenta de apoio etc.), para melhor performar apresentações orais no campo da divulgação do conhecimento.
EF69LP41 | Usar adequadamente ferramentas de apoio a apresentações orais | Usar adequadamente ferramentas de apoio a apresentações orais, escolhendo e usando tipos e tamanhos de fontes que permitam boa visualização, topicalizando e/ou organizando o conteúdo em itens, inserindo de forma adequada imagens, gráficos, tabelas, formas e elementos gráficos, dimensionando a quantidade de texto (e imagem) por slide, usando progressivamente e de forma harmônica recursos mais sofisticados como efeitos de transição, slides mestres, layouts personalizados etc.
EF69LP42 | Construção composicional e estilo. Gêneros de divulgação científica | Analisar a construção composicional dos textos pertencentes a gêneros relacionados à divulgação de conhecimentos: título, (olho), introdução, divisão do texto em subtítulos, imagens ilustrativas de conceitos, relações, ou resultados complexos (fotos, ilustrações, esquemas, gráficos, infográficos, diagramas, figuras, tabelas, mapas) etc., exposição, contendo definições, descrições, comparações, enumerações, exemplificações e remissões a conceitos e relações por meio de notas de rodapé, boxes ou links; ou título, contextualização do campo, ordenação temporal ou temática por tema ou subtema, intercalação de trechos verbais com fotos, ilustrações, áudios, vídeos etc. e reconhecer traços da linguagem dos textos de divulgação científica, fazendo uso consciente das estratégias de impessoalização da linguagem (ou de pessoalização, se o tipo de publicação e objetivos assim o demandarem, como em alguns podcasts e vídeos de divulgação científica), 3ª pessoa, presente atemporal, recurso à citação, uso de vocabulário técnico/especializado etc., como forma de ampliar suas capacidades de compreensão e produção de textos nesses gêneros.
EF69LP43 | Marcas linguísticas. Intertextualidade | Identificar e utilizar os modos de introdução de outras vozes no texto – citação literal e sua formatação e paráfrase –, as pistas linguísticas responsáveis por introduzir no texto a posição do autor e dos outros autores citados (“Segundo X; De acordo com Y; De minha/nossa parte, penso/amos que”...) e os elementos de normatização (tais como as regras de inclusão e formatação de citações e paráfrases, de organização de referências bibliográficas) em textos científicos, desenvolvendo reflexão sobre o modo como a intertextualidade e a retextualização ocorrem nesses textos.
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
