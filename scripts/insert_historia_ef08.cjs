const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08HI01 | A questão do iluminismo e da ilustração | Identificar os principais aspectos conceituais do iluminismo e do liberalismo e discutir a relação entre eles e a organização do mundo contemporâneo.
EF08HI02 | As revoluções inglesas e os princípios do liberalismo | Identificar as particularidades político-sociais da Inglaterra do século XVII e analisar os desdobramentos posteriores à Revolução Gloriosa.
EF08HI03 | Revolução Industrial e seus impactos na produção e circulação de povos, produtos e culturas | Analisar os impactos da Revolução Industrial na produção e circulação de povos, produtos e culturas.
EF08HI04 | Revolução Francesa e seus desdobramentos | Identificar e relacionar os processos da Revolução Francesa e seus desdobramentos na Europa e no mundo.
EF08HI05 | Rebeliões na América portuguesa: as conjurações mineira e baiana | Explicar os movimentos e as rebeliões da América portuguesa, articulando as temáticas locais e suas interfaces com processos ocorridos na Europa e nas Américas.
EF08HI06 | Independência dos Estados Unidos da América | Aplicar os conceitos de Estado, nação, território, governo e país para o entendimento de conflitos e tensões.
EF08HI07 | Independências na América espanhola | Identificar e contextualizar as especificidades dos diversos processos de independência nas Américas, seus aspectos populacionais e suas conformações territoriais.
EF08HI08 | Independências na América espanhola | Conhecer o ideário dos líderes dos movimentos independentistas e seu papel nas revoluções que levaram à independência das colônias hispano-americanas.
EF08HI09 | Independências na América espanhola | Conhecer as características e os principais pensadores do Pan-americanismo.
EF08HI10 | A revolução dos escravizados em São Domingo e seus múltiplos significados e desdobramentos: o caso do Haiti | Identificar a Revolução de São Domingo como evento singular e desdobramento da Revolução Francesa e avaliar suas implicações.
EF08HI11 | Independências na América espanhola | Identificar e explicar os protagonismos e a atuação de diferentes grupos sociais e étnicos nas lutas de independência no Brasil, na América espanhola e no Haiti.
EF08HI12 | Os caminhos até a independência do Brasil | Caracterizar a organização política e social no Brasil desde a chegada da Corte portuguesa, em 1808, até 1822 e seus desdobramentos para a história política brasileira.
EF08HI13 | Independências na América espanhola | Analisar o processo de independência em diferentes países latino-americanos e comparar as formas de governo neles adotadas.
EF08HI14 | A tutela da população indígena, a escravidão dos negros e a tutela dos egressos da escravidão | Discutir a noção da tutela dos grupos indígenas e a participação dos negros na sociedade brasileira do final do período colonial, identificando permanências na forma de preconceitos, estereótipos e violências sobre as populações indígenas e negras no Brasil e nas Américas.
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
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF08";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "HISTÓRIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir/atualizar " + skillsToInsert.length + " habilidades de HISTÓRIA (8º Ano)...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
