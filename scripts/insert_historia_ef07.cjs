const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07HI01 | O mundo moderno e a conexão entre sociedades africanas, americanas e europeias. A construção da ideia de modernidade e seus impactos na concepção de História | Explificar o significado de "modernidade" e suas lógicas de inclusão e exclusão, com base em uma concepção europeia.
EF07HI02 | O mundo moderno e a conexão entre sociedades africanas, americanas e europeias. A ideia de "Novo Mundo" ante o Mundo Antigo: permanências e rupturas de saberes e práticas na emergência do mundo moderno | Identificar conexões e interações entre as sociedades do Novo Mundo, da Europa, da África e da Ásia no contexto das navegações e indicar a complexidade e as interações que ocorrem nos Oceanos Atlântico, Índico e Pacífico.
EF07HI03 | O mundo moderno e a conexão entre sociedades africanas, americanas e europeias. Saberes dos povos africanos e pré-colombianos expressos na cultura material e imaterial | Identificar aspectos e processos específicos das sociedades africanas e americanas antes da chegada dos europeus, com destaque para as formas de organização social e o desenvolvimento de saberes e técnicas.
EF07HI04 | Humanismos, Renascimentos e o Novo Mundo. Humanismos: uma nova visão de ser humano e de mundo. Renascimentos artísticos e culturais | Identificar as principais características dos Humanismos e dos Renascimentos e analisar seus significados.
EF07HI05 | Humanismos, Renascimentos e o Novo Mundo. Reformas religiosas: a cristandade fragmentada | Identificar e relacionar as vinculações entre as reformas religiosas e os processos culturais e sociais do período moderno na Europa e na América.
EF07HI06 | Humanismos, Renascimentos e o Novo Mundo. As descobertas científicas e a expansão marítima | Comparar as navegações no Atlântico e no Pacífico entre os séculos XIV e XVI.
EF07HI07 | A organização do poder e as dinâmicas do mundo colonial americano. A formação e o funcionamento das monarquias europeias: a lógica da centralização política e os conflitos na Europa | Descrever os processos de formação e consolidação das monarquias e suas principais características com vistas à compreensão das razões da centralização política.
EF07HI08 | A organização do poder e as dinâmicas do mundo colonial americano. A conquista da América e as formas de organização política dos indígenas e europeus: conflitos, dominação e conciliação | Descrever as formas de organização das sociedades americanas no tempo da conquista com vistas à compreensão dos mecanismos de alianças, confrontos e resistências.
EF07HI09 | A organização do poder e as dinâmicas do mundo colonial americano. A conquista da América e as formas de organização política dos indígenas e europeus: conflitos, dominação e conciliação | Analisar os diferentes impactos da conquista europeia da América para as populações ameríndias e identificar as formas de resistência.
EF07HI10 | A organização do poder e as dinâmicas do mundo colonial americano. A estruturação dos vice-reinos nas Américas. Resistências indígenas, invasões e expansão na América portuguesa | Analisar, com base em documentos históricos, diferentes interpretações sobre as dinâmicas das sociedades americanas no período colonial.
EF07HI11 | A organização do poder e as dinâmicas do mundo colonial americano. A estruturação dos vice-reinos nas Américas. Resistências indígenas, invasões e expansão na América portuguesa | Analisar a formação histórico-geográfica do território da América portuguesa por meio de mapas históricos.
EF07HI12 | A organização do poder e as dinâmicas do mundo colonial americano. A estruturação dos vice-reinos nas Américas. Resistências indígenas, invasões e expansão na América portuguesa | Identificar a distribuição territorial da população brasileira em diferentes épocas, considerando a diversidade étnico-racial e étnico-cultural (indígena, africana, europeia e asiática).
EF07HI13 | Lógicas comerciais e mercantis da modernidade. As lógicas mercantis e o domínio europeu sobre os mares e o contraponto Oriental | Caracterizar a ação dos europeus e suas lógicas mercantis visando ao domínio no mundo atlântico.
EF07HI14 | Lógicas comerciais e mercantis da modernidade. As lógicas internas das sociedades africanas. As formas de organização das sociedades ameríndias | Descrever as dinâmicas comerciais das sociedades americanas e africanas e analisar suas interações com outras sociedades do Ocidente e do Oriente.
EF07HI15 | Lógicas comerciais e mercantis da modernidade. A escravidão moderna e o tráfico de escravizados | Discutir o conceito de escravidão moderna e suas distinções em relação ao escravismo antigo e à servidão medieval.
EF07HI16 | Lógicas comerciais e mercantis da modernidade. A escravidão moderna e o tráfico de escravizados | Analisar os mecanismos e as dinâmicas de comércio de escravizados em suas diferentes fases, identificando os agentes responsáveis pelo tráfico e as regiões e zonas africanas de procedência dos escravizados.
EF07HI17 | Lógicas comerciais e mercantis da modernidade. A emergência do capitalismo | Discutir as razões da passagem do mercantilismo para o capitalismo.
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
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF07";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "HISTÓRIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir/atualizar " + skillsToInsert.length + " habilidades de HISTÓRIA (7º Ano)...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
