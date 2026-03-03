const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08MA01 | Números. Notação científica | Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento na representação de números em notação científica.
EF08MA02 | Números. Potenciação e radiciação | Resolver e elaborar problemas usando a relação entre potenciação e radiciação, para representar uma raiz como potência de expoente fracionário.
EF08MA03 | Números. O princípio multiplicativo da contagem | Resolver e elaborar problemas de contagem cuja resolução envolva a aplicação do princípio multiplicativo.
EF08MA04 | Números. Porcentagens | Resolver e elaborar problemas, envolvendo cálculo de porcentagens, incluindo o uso de tecnologias digitais.
EF08MA05 | Números. Dízimas periódicas: fração geratriz | Reconhecer e utilizar procedimentos para a obtenção de uma fração geratriz para uma dízima periódica.
EF08MA06 | Álgebra. Valor numérico de expressões algébricas | Resolver e elaborar problemas que envolvam cálculo do valor numérico de expressões algébricas, utilizando as propriedades das operações.
EF08MA07 | Álgebra. Associação de uma equação linear de 1º grau a uma reta no plano cartesiano | Associar uma equação linear de 1º grau com duas incógnitas a uma reta no plano cartesiano.
EF08MA08 | Álgebra. Sistema de equações polinomiais de 1º grau: resolução algébrica e representação no plano cartesiano | Resolver e elaborar problemas relacionados ao seu contexto próximo, que possam ser representados por sistemas de equações de 1º grau com duas incógnitas e interpretá-los, utilizando, inclusive, o plano cartesiano como recurso.
EF08MA09 | Álgebra. Equação polinomial de 2º grau do tipo ax² = b | Resolver e elaborar, com e sem uso de tecnologias, problemas que possam ser representados por equações polinomiais de 2º grau do tipo ax² = b.
EF08MA10 | Álgebra. Sequências recursivas e não recursivas | Identificar a regularidade de uma sequência numérica ou figural não recursiva e construir um algoritmo por meio de um fluxograma que permita indicar os números ou as figuras seguintes.
EF08MA11 | Álgebra. Sequências recursivas e não recursivas | Identificar a regularidade de uma sequência numérica recursiva e construir um algoritmo por meio de um fluxograma que permita indicar os números seguintes.
EF08MA12 | Álgebra. Variação de grandezas: diretamente proporcionais, inversamente proporcionais ou não proporcionais | Identificar a natureza da variação de duas grandezas, diretamente, inversamente proporcionais ou não proporcionais, expressando a relação existente por meio de sentença algébrica e representá-la no plano cartesiano.
EF08MA13 | Álgebra. Variação de grandezas: diretamente proporcionais, inversamente proporcionais ou não proporcionais | Resolver e elaborar problemas que envolvam grandezas diretamente ou inversamente proporcionais, por meio de estratégias variadas.
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
