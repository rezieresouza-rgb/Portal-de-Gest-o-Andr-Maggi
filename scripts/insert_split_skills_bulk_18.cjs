const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67LP36 | Coesão | Utilizar, ao produzir texto, recursos de coesão referencial (léxica e pronominal) e sequencial e outros recursos expressivos adequados ao gênero textual.
EF07LP13 | Coesão | Estabelecer relações entre partes do texto, identificando substituições lexicais (de substantivos por sinônimos) ou pronominais (uso de pronomes anafóricos – pessoais, possessivos, demonstrativos), que contribuem para a continuidade do texto.
EF67LP37 | Sequências textuais | Analisar, em diferentes textos, os efeitos de sentido decorrentes do uso de recursos linguístico-discursivos de prescrição, causalidade, sequências descritivas e expositivas e ordenação de eventos.
EF07LP14 | Modalização | Identificar, em textos, os efeitos de sentido do uso de estratégias de modalização e argumentatividade.
EF67LP38 | Figuras de linguagem | Analisar os efeitos de sentido do uso de figuras de linguagem, como comparação, metáfora, metonímia, personificação, hipérbole, dentre outras.
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
