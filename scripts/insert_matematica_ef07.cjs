const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07MA01 | Números. Múltiplos e divisores de um número natural | Resolver e elaborar problemas com números naturais, envolvendo as noções de divisor e de múltiplo, podendo incluir máximo divisor comum ou mínimo múltiplo comum, por meio de estratégias diversas, sem a aplicação de algoritmos.
EF07MA02 | Números. Cálculo de porcentagens e de acréscimos e decréscimos simples | Resolver e elaborar problemas que envolvam porcentagens, como os que lidam com acréscimos e decréscimos simples, utilizando estratégias pessoais, cálculo mental e calculadora, no contexto de educação financeira, entre outros.
EF07MA03 | Números. Números inteiros: usos, história, ordenação, associação com pontos da reta numérica e operações | Comparar e ordenar números inteiros em diferentes contextos, incluindo o histórico, associá-los a pontos da reta numérica e utilizá-los em situações que envolvam adição e subtração.
EF07MA04 | Números. Números inteiros: usos, história, ordenação, associação com pontos da reta numérica e operações | Resolver e elaborar problemas que envolvam operações com números inteiros.
EF07MA05 | Números. Fração e seus significados: como parte de inteiros, resultado da divisão, razão e operador | Resolver um mesmo problema utilizando diferentes algoritmos.
EF07MA06 | Números. Fração e seus significados: como parte de inteiros, resultado da divisão, razão e operador | Reconhecer que as resoluções de um grupo de problemas que têm a mesma estrutura podem ser obtidas utilizando os mesmos procedimentos.
EF07MA07 | Números. Fração e seus significados: como parte de inteiros, resultado da divisão, razão e operador | Representar por meio de um fluxograma os passos utilizados para resolver um grupo de problemas.
EF07MA08 | Números. Fração e seus significados: como parte de inteiros, resultado da divisão, razão e operador | Comparar e ordenar frações associadas às ideias de partes de inteiros, resultado da divisão, razão e operador.
EF07MA09 | Números. Fração e seus significados: como parte de inteiros, resultado da divisão, razão e operador | Utilizar, na resolução de problemas, a associação entre razão e fração, como a fração 2/3 para expressar a razão de duas partes de uma grandeza para três partes da mesma ou três partes de outra grandeza.
EF07MA10 | Números. Números racionais na representação fracionária e na decimal: usos, ordenação e associação com pontos da reta numérica e operações | Comparar e ordenar números racionais em diferentes contextos e associá-los a pontos da reta numérica.
EF07MA11 | Números. Números racionais na representação fracionária e na decimal: usos, ordenação e associação com pontos da reta numérica e operações | Compreender e utilizar a multiplicação e a divisão de números racionais, a relação entre elas e suas propriedades operatórias.
EF07MA12 | Números. Números racionais na representação fracionária e na decimal: usos, ordenação e associação com pontos da reta numérica e operações | Resolver e elaborar problemas que envolvam as operações com números racionais.
EF07MA13 | Álgebra. Linguagem algébrica: variável e incógnita | Compreender a ideia de variável, representada por letra ou símbolo, para expressar relação entre duas grandezas, diferenciando-a da ideia de incógnita.
EF07MA14 | Álgebra. Linguagem algébrica: variável e incógnita | Classificar sequências em recursivas e não recursivas, reconhecendo que o conceito de recursão está presente não apenas na matemática, mas também nas artes e na literatura.
EF07MA15 | Álgebra. Linguagem algébrica: variável e incógnita | Utilizar a simbologia algébrica para expressar regularidades encontradas em sequências numéricas.
EF07MA16 | Álgebra. Equivalência de expressões algébricas: identificação da regularidade de uma sequência numérica | Reconhecer se duas expressões algébricas obtidas para descrever a regularidade de uma mesma sequência numérica são ou não equivalentes.
EF07MA17 | Álgebra. Problemas envolvendo grandezas diretamente proporcionais e grandezas inversamente proporcionais | Resolver e elaborar problemas que envolvam variação de proporcionalidade direta e de proporcionalidade inversa entre duas grandezas, utilizando sentença algébrica para expressar a relação entre elas.
EF07MA18 | Álgebra. Equações polinomiais do 1º grau | Resolver e elaborar problemas que possam ser representados por equações polinomiais de 1º grau, redutíveis à forma ax + b = c, fazendo uso das propriedades da igualdade.
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
