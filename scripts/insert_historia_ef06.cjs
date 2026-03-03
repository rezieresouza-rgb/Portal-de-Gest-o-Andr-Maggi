const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06HI01 | História: tempo, espaço e formas de registros. A questão do tempo, sincronias e diacronias: reflexões sobre o sentido das cronologias | Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos (continuidades e rupturas).
EF06HI02 | História: tempo, espaço e formas de registros. Formas de registro da história e da produção do conhecimento histórico | Identificar a gênese da produção do saber histórico e analisar o significado das fontes que originaram determinadas formas de registro em sociedades e épocas distintas.
EF06HI03 | História: tempo, espaço e formas de registros. As origens da humanidade, seus deslocamentos e os processos de sedentarização | Identificar as hipóteses científicas sobre o surgimento da espécie humana e sua historicidade e analisar os significados dos mitos de fundação.
EF06HI04 | História: tempo, espaço e formas de registros. As origens da humanidade, seus deslocamentos e os processos de sedentarização | Conhecer as teorias sobre a origem do homem americano.
EF06HI05 | História: tempo, espaço e formas de registros. As origens da humanidade, seus deslocamentos e os processos de sedentarização | Descrever modificações da natureza e da paisagem realizadas por differentes tipos de sociedade, com destaque para os povos indígenas originários e povos africanos, e discutir a natureza e a lógica das transformações ocorridas.
EF06HI06 | História: tempo, espaço e formas de registros. As origens da humanidade, seus deslocamentos e os processos de sedentarização | Identificar geograficamente as rotas de povoamento no território americano.
EF06HI07 | A invenção do mundo clássico e o contraponto com outras sociedades. Povos da Antiguidade na África (egípcios), no Oriente Médio (mesopotâmicos) e nas Américas (pré-colombianos) | Identificar aspectos e formas de registro das sociedades antigas na África, no Oriente Médio e nas Américas, distinguindo alguns significados presentes na cultura material e na tradição oral dessas sociedades.
EF06HI08 | A invenção do mundo clássico e o contraponto com outras sociedades. Povos indígenas originários do atual território brasileiro e seus hábitos culturais e sociais | Identificar os espaços territoriais ocupados e os aportes culturais, científicos, sociais e econômicos dos astecas, maias e incas e dos povos indígenas do território americano.
EF06HI09 | A invenção do mundo clássico e o contraponto com outras sociedades. O Ocidente Clássico: aspectos da cultura na Grécia e em Roma | Discutir o conceito de Antiguidade Clássica, seu alcance e limite na tradição ocidental, assim como os impactos sobre outras sociedades e culturas.
EF06HI10 | Lógicas de organização política. As noções de cidadania e política na Grécia e em Roma | Explicar a formação da Grécia Antiga, com ênfase na formação da pólis e nas transformações políticas, sociais e culturais.
EF06HI11 | Lógicas de organização política. As noções de cidadania e política na Grécia e em Roma. Domínios e expansão das culturas grega e romana | Caracterizar o processo de formação da Roma Antiga e suas configurações sociais e políticas nos períodos monárquico e republicano.
EF06HI12 | Lógicas de organização política. As noções de cidadania e política na Grécia e em Roma. Significados do conceito de "império" e as lógicas de conquista, conflito e negociação dessa forma de organização política | Associar o conceito de cidadania a dinâmicas de inclusão e exclusão na Grécia e Roma antigas.
EF06HI13 | Lógicas de organização política. As diferentes formas de organização política na África: reinos, impérios, cidades-estados e sociedades linhageiras ou aldeias | Conceituar "império" no mundo antigo, com vistas à análise das diferentes formas de equilíbrio e desequilíbrio entre as partes envolvidas.
EF06HI14 | Lógicas de organização política. A passagem do mundo antigo para o mundo medieval. A fragmentação do poder político na Idade Média | Identificar e analisar diferentes formas de contato, adaptação ou exclusão entre populações em diferentes tempos e espaços.
EF06HI15 | Lógicas de organização política. O Mediterrâneo como espaço de interação entre as sociedades da Europa, da África e do Oriente Médio | Descrever as dinâmicas de circulação de pessoas, produtos e culturas no Mediterrâneo e seu significado.
EF06HI16 | Trabalho e formas de organização social e cultural. Senhores e servos no mundo antigo e no medieval. Escravidão e trabalho livre em diferentes temporalidades e espaços (Roma Antiga, Europa medieval e África) | Caracterizar e comparar as dinâmicas de abastecimento e as formas de organização do trabalho e da vida social em diferentes sociedades e períodos, com destaque para as relações entre senhores e servos.
EF06HI17 | Trabalho e formas de organização social e cultural. Senhores e servos no mundo antigo e no medieval. Escravidão e trabalho livre em diferentes temporalidades e espaços (Roma Antiga, Europa medieval e África) | Diferenciar escravidão, servidão e trabalho livre no mundo antigo.
EF06HI18 | Trabalho e formas de organização social e cultural. Lógicas comerciais na Antiguidade romana e no mundo medieval. O papel da religião cristã, dos mosteiros e da cultura na Idade Média | Analisar o papel da religião cristã na cultura e nos modos de organização social no período medieval.
EF06HI19 | Trabalho e formas de organização social e cultural. O papel da mulher na Grécia e em Roma, e no período medieval | Descrever e analisar os diferentes papéis sociais das mulheres no mundo antigo e nas sociedades medievais.
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
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF06";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "HISTÓRIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir/atualizar " + skillsToInsert.length + " habilidades de HISTÓRIA (6º Ano)...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
