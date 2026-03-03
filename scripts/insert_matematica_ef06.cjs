const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06MA01 | Números. Sistema de numeração decimal: características, leitura, escrita e comparação de números naturais e de números racionais representados na forma decimal | Comparar, ordenar, ler e escrever números naturais e números racionais cuja representação decimal é finita, fazendo uso da reta numérica.
EF06MA02 | Números. Sistema de numeração decimal: características, leitura, escrita e comparação de números naturais e de números racionais representados na forma decimal | Reconhecer o sistema de numeração decimal, como o que prevaleceu no mundo ocidental, e destacar semelhanças e diferenças com outros sistemas, de modo a sistematizar suas principais características (base, valor posicional e função do zero), utilizando, inclusive, a composição e decomposição de números naturais e números racionais em sua representação decimal.
EF06MA03 | Números. Operações (adição, subtração, multiplicação, divisão e potenciação) com números naturais. Divisão euclidiana | Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas, com compreensão dos processos neles envolvidos e com e sem uso de calculadora.
EF06MA04 | Números. Fluxograma para determinar a paridade de um número natural. Múltiplos e divisores de um número natural. Números primos e compostos | Construir algoritmo em linguagem natural e representá-lo por fluxograma que indique a resolução de um problema simples (por exemplo, se um número natural qualquer é par).
EF06MA05 | Números. Fluxograma para determinar a paridade de um número natural. Múltiplos e divisores de um número natural. Números primos e compostos | Classificar números naturais em primos e compostos, estabelecer relações entre números, expressas pelos termos "é múltiplo de", "é divisor de", "é fator de", e estabelecer, por meio de investigações, critérios de divisibilidade por 2, 3, 4, 5, 6, 8, 9, 10, 100 e 1000.
EF06MA06 | Números. Fluxograma para determinar a paridade de um número natural. Múltiplos e divisores de um número natural. Números primos e compostos | Resolver e elaborar problemas que envolvam as ideias de múltiplo e de divisor.
EF06MA07 | Números. Frações: significados (parte/todo, quociente), equivalência, comparação, adição e subtração; cálculo da fração de um número natural; adição e subtração de frações | Compreender, comparar e ordenar frações associadas às ideias de partes de inteiros e resultado de divisão, identificando frações equivalentes.
EF06MA08 | Números. Frações: significados (parte/todo, quociente), equivalência, comparação, adição e subtração; cálculo da fração de um número natural; adição e subtração de frações | Reconhecer que os números racionais positivos podem ser expressos nas formas fracionária e decimal, estabelecer relações entre essas representações, passando de uma representação para outra, e relacioná-los a pontos na reta numérica.
EF06MA09 | Números. Frações: significados (parte/todo, quociente), equivalência, comparação, adição e subtração; cálculo da fração de um número natural; adição e subtração de frações | Resolver e elaborar problemas que envolvam o cálculo da fração de uma quantidade e cujo resultado seja um número natural, com e sem uso de calculadora.
EF06MA10 | Números. Frações: significados (parte/todo, quociente), equivalência, comparação, adição e subtração; cálculo da fração de um número natural; adição e subtração de frações | Resolver e elaborar problemas que envolvam adição ou subtração com números racionais positivos na representação fracionária.
EF06MA11 | Números. Operações (adição, subtração, multiplicação, divisão e potenciação) com números racionais | Resolver e elaborar problemas com números racionais positivos na representação decimal, envolvendo as quatro operações fundamentais e a potenciação, por meio de estratégias diversas, utilizando estimativas e arredondamentos para verificar a razoabilidade de respostas, com e sem uso de calculadora.
EF06MA12 | Números. Aproximação de números para múltiplos de potências de 10 | Fazer estimativas de quantidades e aproximar números para múltiplos da potência de 10 mais próxima.
EF06MA13 | Números. Cálculo de porcentagens por meio de estratégias diversas, sem fazer uso da "regra de três" | Resolver e elaborar problemas que envolvam porcentagens, com base na ideia de proporcionalidade, sem fazer uso da "regra de três", utilizando estratégias pessoais, cálculo mental e calculadora, em contextos de educação financeira, entre outros.
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
