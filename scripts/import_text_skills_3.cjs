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
(EF06LP01) Reconhecer a impossibilidade de uma neutralidade absoluta no relato de fatos e identificar diferentes graus de parcialidade/imparcialidade dados pelo recorte feito e pelos efeitos de sentido advindos de escolhas feitas pelo autor, de forma a poder desenvolver uma atitude crítica frente aos textos jornalísticos e tornar-se consciente das escolhas feitas enquanto produtor de textos.
(EF06LP02) Estabelecer relação entre os diferentes gêneros jornalísticos, compreendendo a centralidade da notícia.
(EF06LP03) Analisar diferenças de sentido entre palavras de uma série sinonímica
(EF06LP04) Analisar a função e as flexões de substantivos e adjetivos e de verbos nos modos Indicativo, Subjuntivo e Imperativo: afirmativo e negativo.
(EF06LP05) Identificar os efeitos de sentido dos modos verbais, considerando o gênero textual e a intenção comunicativa.
(EF06LP06) Empregar, adequadamente, as regras de concordância nominal (relações entre os substantivos e seus determinantes) e as regras de concordância verbal (relações entre o verbo e o sujeito simples e composto).
(EF06LP07) Identificar, em textos, períodos compostos por orações separadas por vírgula sem a utilização de conectivos, nomeando-os como períodos compostos por coordenação.
(EF06LP08) Identificar, em texto ou sequência textual, orações como unidades constituídas em torno de um núcleo verbal e períodos como conjunto de orações conectadas.
(EF06LP09) Classificar, em texto ou sequência textual, os períodos simples compostos.
(EF06LP10) Identificar sintagmas nominais e verbais como constituintes imediatos da oração.
(EF06LP11) Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: tempos verbais, concordância nominal e verbal, regras ortográficas, pontuação etc.
(EF06LP12) Utilizar, ao produzir texto, recursos de coesão referencial (nome e pronomes), recursos semânticos de sinonímia, antonímia e homonímia e mecanismos de representação de diferentes vozes (discurso direto e indireto).
`;

async function parseAndInsert() {
    const regex = /\((EF06LP\d{2})\)\s*([\s\S]*?)(?=(?:\(EF06LP\d{2}\)|\n$|$))/g;

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
            year_range: "EF06" // A barra de pesquisa puxa as faixas de anos usando o 'EF06' para 6º ano
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
