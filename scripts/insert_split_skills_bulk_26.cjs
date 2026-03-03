const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF09LP09 | Elementos notacionais da escrita/morfossintaxe | Identificar efeitos de sentido do uso de orações adjetivas restritivas e explicativas em um período composto.
EF08LP14 | Semântica | Utilizar, ao produzir texto, recursos de coesão sequencial (articuladores) e referencial (léxica e pronominal), construções passivas e impessoais, discurso direto e indireto e outros recursos expressivos adequados ao gênero textual.
EF08LP15 | Coesão | Estabelecer relações entre partes do texto, identificando o antecedente de um pronome relativo ou a referente comum de uma cadeia de substituições lexicais.
EF09LP10 | Coesão | Comparar as regras de colocação pronominal na norma-padrão com o seu uso no português brasileiro coloquial.
EF09LP11 | Coesão | Inferir efeitos de sentido decorrentes do uso de recursos de coesão sequencial (conjunções e articuladores textuais).
EF08LP16 | Modalização | Explicar os efeitos de sentido do uso, em textos, de estratégias de modalização e argumentatividade (sinais de pontuação, adjetivos, substantivos, expressões de grau, verbos e paráfrases verbais, advérbios etc.).
EF89LP37 | Figuras de linguagem | Analisar os efeitos de sentido do uso de figuras de linguagem como ironia, eufemismo, antítese, aliteração, assonância, dentre outras.
EF09LP12 | Variação linguística | Identificar estrangeirismos, caracterizando-os segundo a conservação, ou não, de sua forma gráfica de origem, avaliando a pertinência, ou não, de seu uso.
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
