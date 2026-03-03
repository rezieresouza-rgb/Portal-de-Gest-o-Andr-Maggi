const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67LP30 | Construção da textualidade. Relação entre textos | Criar narrativas ficcionais, tais como contos populares, contos de suspense, mistério, terror, humor, narrativas de enigma, crônicas, histórias em quadrinhos, dentre outros, que utilizem cenários e personagens realistas ou de fantasia, observando os elementos da estrutura narrativa próprios ao gênero pretendido, tais como enredo, personagens, tempo, espaço e narrador, utilizando tempos verbais adequados à narração de fatos passados, empregando conhecimentos sobre diferentes modos de se iniciar uma história e de inserir os discursos direto e indireto.
EF67LP31 | Construção da textualidade. Relação entre textos | Criar poemas compostos por versos livres e de forma fixa (como quadras e sonetos), utilizando recursos visuais, semânticos e sonoros, tais como cadências, ritmos e rimas, e poemas visuais e vídeo-poemas, explorando as relações entre imagem e texto verbal, a distribuição da mancha gráfica (poema visual) e outros recursos visuais e sonoros.
EF67LP32 | Fono-ortografia | Escrever palavras com correção ortográfica, obedecendo as convenções da língua escrita.
EF67LP33 | Elementos notacionais da escrita | Pontuar textos adequadamente.
EF06LP03 | Léxico/morfologia | Analisar diferenças de sentido entre palavras de uma série sinonímica.
EF07LP03 | Léxico/morfologia | Formar, com base em palavras primitivas, palavras derivadas com os prefixos e sufixos mais produtivos no português.
EF67LP34 | Léxico/morfologia | Formar antônimos com acréscimo de prefixos que expressam noção de negação.
EF67LP35 | Léxico/morfologia | Distinguir palavras derivadas por acréscimo de afixos e palavras compostas.
EF06LP04 | Morfossintaxe | Analisar a função e as flexões de substantivos e adjetivos e de verbos nos modos Indicativo, Subjuntivo e Imperativo: afirmativo e negativo.
EF07LP04 | Morfossintaxe | Reconhecer, em textos, o verbo como o núcleo das orações.
EF06LP05 | Morfossintaxe | Identificar os efeitos de sentido dos modos verbais, considerando o gênero textual e a intenção comunicativa.
EF07LP05 | Morfossintaxe | Identificar, em orações de textos lidos ou de produção própria, verbos de predicação completa e incompleta: intransitivos e transitivos.
EF06LP06 | Morfossintaxe | Empregar, adequadamente, as regras de concordância nominal (relações entre os substantivos e seus determinantes) e as regras de concordância verbal (relações entre o verbo e o sujeito simples e composto).
EF07LP06 | Morfossintaxe | Empregar as regras básicas de concordância nominal e verbal em situações comunicativas e na produção de textos.
EF07LP07 | Morfossintaxe | Identificar, em textos lidos ou de produção própria, a estrutura básica da oração: sujeito, predicado, complemento (objetos direto e indireto).
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
