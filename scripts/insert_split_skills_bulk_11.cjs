const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69LP53 | Produção de textos orais. Oralização | Ler em voz alta textos literários diversos – como contos de amor, de humor, de suspense, de terror; crônicas líricas, humorísticas, críticas; bem como leituras orais capituladas (compartilhadas ou não com o professor) de livros de maior extensão, como romances, narrativas de enigma, narrativas de aventura, literatura infantojuvenil, – contar/recontar histórias tanto da tradição oral (causos, contos de esperteza, contos de animais, contos de amor, contos de encantamento, piadas, dentre outros) quanto da tradição literária escrita, expressando a compreensão e interpretação do texto por meio de uma leitura ou fala expressiva e fluente, que respeite o ritmo, as pausas, as hesitações, a entonação indicados tanto pela pontuação quanto por outros recursos gráfico-editoriais, como negritos, itálicos, caixa-alta, ilustrações etc., gravando essa leitura ou esse conto/reconto, seja para análise posterior, seja para produção de audiobooks de textos literários diversos ou de podcasts de leituras dramáticas com ou sem efeitos especiais e ler e/ou declamar poemas diversos, tanto de forma livre quanto de forma fixa (como quadras, sonetos, liras, haicais etc.), empregando os recursos linguísticos, paralinguísticos e cinésicos necessários aos efeitos de sentido pretendidos, como o ritmo e a entonação, o emprego de pausas e prolongamentos, o tom e o timbre vocais, bem como eventuais recursos de gestualidade e pantomima que convenham ao gênero poético e à situação de compartilhamento em questão.
EF69LP54 | Recursos linguísticos e semióticos que operam nos textos pertencentes aos gêneros literários | Analisar os efeitos de sentido decorrentes da interação entre os elementos linguísticos e os recursos paralinguísticos e cinésicos, como as variações no ritmo, as modulações no tom de voz, as pausas, as manipulações do estrato sonoro da linguagem, obtidos por meio da estrofação, das rimas e de figuras de linguagem como as aliterações, as assonâncias, as onomatopeias, dentre outras, a postura corporal e a gestualidade, na declamação de poemas, apresentações musicais e teatrais, tanto em gêneros em prosa quanto nos gêneros poéticos, os efeitos de sentido decorrentes do emprego de figuras de linguagem, tais como comparação, metáfora, personificação, metonímia, hipérbole, eufemismo, ironia, paradoxo e antítese e os efeitos de sentido decorrentes do emprego de palavras e expressões denotativas e conotativas (adjetivos, locuções adjetivas, orações subordinadas adjetivas etc.), que funcionam como modificadores, percebendo sua função na caracterização dos espaços, tempos, personagens e ações próprios de cada gênero narrativo.
EF69LP55 | Variação linguística | Reconhecer as variedades da língua falada, o conceito de norma-padrão e o de preconceito linguístico.
EF69LP56 | Variação linguística | Fazer uso consciente e reflexivo de regras e normas da norma-padrão em situações de fala e escrita nas quais ela deve ser usada.
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
