const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07LP08 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, adjetivos que ampliam o sentido do substantivo sujeito ou complemento verbal.
EF07LP09 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, advérbios e locuções adverbiais que ampliam o sentido do verbo núcleo da oração.
EF06LP07 | Morfossintaxe | Identificar, em textos, períodos compostos por orações separadas por vírgula sem a utilização de conectivos, nomeando-os como períodos compostos por coordenação.
EF06LP08 | Morfossintaxe | Identificar, em texto ou sequência textual, orações como unidades constituídas em torno de um núcleo verbal e períodos como conjunto de orações conectadas.
EF07LP10 | Morfossintaxe | Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: modos e tempos verbais, concordância nominal e verbal, pontuação etc.
EF06LP09 | Morfossintaxe | Classificar, em texto ou sequência textual, os períodos simples compostos.
EF07LP11 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, períodos compostos nos quais duas orações são conectadas por vírgula, ou por conjunções que expressem soma de sentido (conjunção "e") ou oposição de sentidos (conjunções "mas", "porém").
EF06LP10 | Sintaxe | Identificar sintagmas nominais e verbais como constituintes imediatos da oração.
EF06LP11 | Elementos notacionais da escrita/morfossintaxe | Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: tempos verbais, concordância nominal e verbal, regras ortográficas, pontuação etc.
EF06LP12 | Semântica. Coesão | Utilizar, ao produzir texto, recursos de coesão referencial (nome e pronomes), recursos semânticos de sinonímia, antonímia e homonímia e mecanismos de representação de diferentes vozes (discurso direto e indireto).
EF07LP12 | Semântica. Coesão | Reconhecer recursos de coesão referencial: substituições lexicais (de substantivos por sinônimos) ou pronominais (uso de pronomes anafóricos – pessoais, possessivos, demonstrativos).
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
