const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06MA30 | Probabilidade e estatística. Cálculo de probabilidade como a razão entre o número de resultados favoráveis e o total de resultados possíveis em um espaço amostral equiprovável. Cálculo de probabilidade por meio de muitas repetições de um experimento (frequências de ocorrências e probabilidade frequentista) | Calcular a probabilidade de um evento aleatório, expressando-a por número racional (forma fracionária, decimal e percentual) e comparar esse número com a probabilidade obtida por meio de experimentos sucessivos.
EF06MA31 | Probabilidade e estatística. Leitura e interpretação de tabelas e gráficos (de colunas ou barras simples ou múltiplas) referentes a variáveis categóricas e variáveis numéricas | Identificar as variáveis e suas frequências e os elementos constitutivos (título, eixos, legendas, fontes e datas) em diferentes tipos de gráfico.
EF06MA32 | Probabilidade e estatística. Leitura e interpretação de tabelas e gráficos (de colunas ou barras simples ou múltiplas) referentes a variáveis categóricas e variáveis numéricas | Interpretar e resolver situações que envolvam dados de pesquisas sobre contextos ambientais, sustentabilidade, trânsito, consumo responsável, entre outros, apresentadas pela mídia em tabelas e em diferentes tipos de gráficos e redigir textos escritos com o objetivo de sintetizar conclusões.
EF06MA33 | Probabilidade e estatística. Coleta de dados, organização e registro. Construção de diferentes tipos de gráficos para representá-los e interpretação das informações | Planejar e coletar dados de pesquisa referente a práticas sociais escolhidas pelos alunos e fazer uso de planilhas eletrônicas para registro, representação e interpretação das informações, em tabelas, vários tipos de gráficos e texto.
EF06MA34 | Probabilidade e estatística. Diferentes tipos de representação de informações: gráficos e fluxogramas | Interpretar e desenvolver fluxogramas simples, identificando as relações entre os objetos representados (por exemplo, posição de cidades considerando as estradas que as unem, hierarquia dos funcionários de uma empresa etc.).
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

            skillsToInsert.push({ code, description: fullDescription, subject: "MATEMÁTICA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
