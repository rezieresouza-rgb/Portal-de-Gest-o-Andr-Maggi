const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF08MA14 | Geometria. Congruência de triângulos e demonstrações de propriedades de quadriláteros | Demonstrar propriedades de quadriláteros por meio da identificação da congruência de triângulos.
EF08MA15 | Geometria. Construções geométricas: ângulos de 90°, 60°, 45° e 30° e polígonos regulares | Construir, utilizando instrumentos de desenho ou softwares de geometria dinâmica, mediatriz, bissetriz, ângulos de 90°, 60°, 45° e 30° e polígonos regulares.
EF08MA16 | Geometria. Construções geométricas: ângulos de 90°, 60°, 45° e 30° e polígonos regulares | Descrever, por escrito e por meio de um fluxograma, um algoritmo para a construção de um hexágono regular de qualquer área, a partir da medida do ângulo central e da utilização de esquadros e compasso.
EF08MA17 | Geometria. Mediatriz e bissetriz como lugares geométricos: construção e problemas | Aplicar os conceitos de mediatriz e bissetriz como lugares geométricos na resolução de problemas.
EF08MA18 | Geometria. Transformações geométricas: simetrias de translação, reflexão e rotação | Reconhecer e construir figuras obtidas por composições de transformações geométricas (translação, reflexão e rotação), com o uso de instrumentos de desenho ou de softwares de geometria dinâmica.
EF08MA19 | Grandezas e medidas. Área de figuras planas. Área do círculo e comprimento de sua circunferência | Resolver e elaborar problemas que envolvam medidas de área de figuras geométricas, utilizando expressões de cálculo de área (quadriláteros, triângulos e círculos), em situações como determinar medida de terrenos.
EF08MA20 | Grandezas e medidas. Volume de bloco retangular. Medidas de capacidade | Reconhecer a relação entre um litro e um decímetro cúbico e a relação entre litro e metro cúbico, para resolver problemas de cálculo de capacidade de recipientes.
EF08MA21 | Grandezas e medidas. Volume de bloco retangular. Medidas de capacidade | Resolver e elaborar problemas que envolvam o cálculo do volume de recipiente cujo formato é o de um bloco retangular.
EF08MA22 | Probabilidade e estatística. Princípio multiplicativo da contagem. Soma das probabilidades de todos os elementos de um espaço amostral | Calcular a probabilidade de eventos, com base na construção do espaço amostral, utilizando o princípio multiplicativo, e reconhecer que a soma das probabilidades de todos os elementos do espaço amostral é igual a 1.
EF08MA23 | Probabilidade e estatística. Gráficos de barras, colunas, linhas ou setores e seus elementos constitutivos e adequação para determinado conjunto de dados | Avaliar a adequação de diferentes tipos de gráficos para representar um conjunto de dados de uma pesquisa.
EF08MA24 | Probabilidade e estatística. Organização dos dados de uma variável contínua em classes | Classificar as frequências de uma variável contínua de uma pesquisa em classes, de modo que resumam os dados de maneira adequada para a tomada de decisões.
EF08MA25 | Probabilidade e estatística. Medidas de tendência central e de dispersão | Obter os valores de medidas de tendência central de uma pesquisa estatística (média, moda e mediana) com a compreensão de seus significados e relacioná-los com a dispersão de dados, indicada pela amplitude.
EF08MA26 | Probabilidade e estatística. Pesquisas censitária ou amostral. Planejamento e execução de pesquisa amostral | Selecionar razões, de diferentes naturezas (física, ética ou econômica), que justificam a realização de pesquisas amostrais e não censitárias, e reconhecer que a seleção da amostra pode ser feita de diferentes maneiras (amostra casual simples, sistemática e estratificada).
EF08MA27 | Probabilidade e estatística. Pesquisas censitária ou amostral. Planejamento e execução de pesquisa amostral | Planejar e executar pesquisa amostral, selecionando uma técnica de amostragem adequada, e escrever relatório que contenha os gráficos apropriados para representar os conjuntos de dados, destacando aspectos como as medidas de tendência central, a amplitude e as conclusões.
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
