const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawText = `
(EF07LP01) Distinguir diferentes propostas editoriais – sensacionalismo, jornalismo investigativo etc. –, de forma a identificar os recursos utilizados para impactar/chocar o leitor que podem comprometer uma análise crítica da notícia e do fato noticiado.
(EF07LP02) Comparar notícias e reportagens sobre um mesmo fato divulgadas em diferentes mídias, analisando as especificidades das mídias, os processos de (re)elaboração dos textos e a convergência das mídias em notícias ou reportagens multissemióticas.
(EF07LP03) Formar, com base em palavras primitivas, palavras derivadas com os prefixos e sufixos mais produtivos no português.
(EF07LP04) Reconhecer, em textos, o verbo como o núcleo das orações.
(EF07LP05) Identificar, em orações de textos lidos ou de produção própria, verbos de predicação completa e incompleta: intransitivos e transitivos
(EF07LP06) Empregar as regras básicas de concordância nominal e verbal em situações comunicativas e na produção de textos.
(EF07LP07) Identificar, em textos lidos ou de produção própria, a estrutura básica da oração: sujeito, predicado, complemento (objetos direto e indireto).
(EF07LP08) Identificar, em textos lidos ou de produção própria, adjetivos que ampliam o sentido do substantivo sujeito ou complemento verbal.
(EF07LP09) Identificar, em textos lidos ou de produção própria, advérbios e locuções adverbiais que ampliam o sentido do verbo núcleo da oração.
(EF07LP10) Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: modos e tempos verbais, concordância nominal e verbal, pontuação etc.
(EF07LP11) Identificar, em textos lidos ou de produção própria, períodos compostos nos quais duas orações são conectadas por vírgula, ou por conjunções que expressem soma de sentido (conjunção “e”) ou oposição de sentidos (conjunções “mas”, “porém”).
(EF07LP12) Reconhecer recursos de coesão referencial: substituições lexicais (de substantivos por sinônimos) ou pronominais (uso de pronomes anafóricos – pessoais, possessivos, demonstrativos).
(EF07LP13) Estabelecer relações entre partes do texto, identificando substituições lexicais (de substantivos por sinônimos) ou pronominais (uso de pronomes anafóricos – pessoais, possessivos, demonstrativos), que contribuem para a continuidade do texto.
(EF07LP14) Identificar, em textos, os efeitos de sentido do uso de estratégias de modalização e argumentatividade.
`;

async function parseAndInsert() {
    const regex = /\((EF07LP\d{2})\)\s*([\s\S]*?)(?=(?:\(EF07LP\d{2}\)|\n$|$))/g;

    let match;
    const skillsToInsert = [];

    while ((match = regex.exec(rawText)) !== null) {
        const code = match[1].trim();
        let description = match[2].trim();

        // Clean up newlines to form a single continuous paragraph
        description = description.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');

        skillsToInsert.push({
            code: code,
            description: description,
            subject: "LÍNGUA PORTUGUESA", // Baseado no código LP
            year_range: "EF07" // A barra de pesquisa puxa as faixas de anos usando o 'EF07' para 7º ano
        });
    }

    console.log(`Extracted ${skillsToInsert.length} skills. First 2:`);
    console.log(skillsToInsert.slice(0, 2));

    if (skillsToInsert.length === 0) {
        console.log("No skills matched the pattern.");
        return;
    }

    console.log("Inserting into Supabase 'bncc_skills'...");
    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log(`Successfully inserted/updated ${result ? result.length : 'unknown'} skills!`);
    }
}

parseAndInsert();
