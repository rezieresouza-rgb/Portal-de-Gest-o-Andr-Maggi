const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08LP06 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, os termos constitutivos de oração (sujeito e seus modificadores, verbo e seus complementos e modificadores).
EF09LP05 | Morfossintaxe | Identificar, em textos lidos e em produções próprias, orações com a estrutura sujeito-verbo de ligação-predicativo.
EF08LP07 | Morfossintaxe | Diferenciar, em textos lidos ou de produção própria, complementos diretos e indiretos de verbos transitivos, apropriando-se da regência de verbos de uso frequente.
EF09LP06 | Morfossintaxe | Diferenciar, em textos lidos e em produções próprias, o efeito de sentido do uso dos verbos de ligação "ser", "estar", "ficar", "parecer" e "permanecer".
EF08LP08 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, verbos na voz ativa e na voz passiva, interpretando os efeitos de sentido de sujeito ativo e passivo (agente da passiva).
EF09LP07 | Morfossintaxe | Comparar o uso de regência verbal e regência nominal na norma-padrão com seu uso no português brasileiro coloquial oral.
EF08LP09 | Morfossintaxe | Interpretar efeitos de sentido de modificadores (adjuntos adnominais – artigos definido ou indefinido, adjetivos, expressões adjetivas) em substantivos com função de sujeito ou de complemento verbal, usando-os para enriquecer seus próprios textos.
EF08LP10 | Morfossintaxe | Interpretar, em textos lidos ou de produção própria, efeitos de sentido de modificadores do verbo (adjuntos adverbiais – advérbios e expressões adverbiais), usando-os para enriquecer seus próprios textos.
EF08LP11 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, agrupamento de orações em períodos, diferenciando coordenação de subordinação.
EF08LP12 | Morfossintaxe | Identificar, em textos lidos, orações subordinadas com conjunções de uso frequente, incorporando-as às suas próprias produções.
EF09LP08 | Morfossintaxe | Identificar, em textos lidos e em produções próprias, a relação que conjunções (e locuções conjuntivas) coordenativas e subordinativas estabelecem entre as orações que conectam.
EF08LP13 | Morfossintaxe | Inferir efeitos de sentido decorrentes do uso de recursos de coesão sequencial: conjunções e articuladores textuais.
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
