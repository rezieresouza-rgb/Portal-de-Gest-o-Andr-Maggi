const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07MA19 | Geometria. Transformações geométricas de polígonos no plano cartesiano: multiplicação das coordenadas por um número inteiro e obtenção de simétricos em relação aos eixos e à origem | Realizar transformações de polígonos representados no plano cartesiano, decorrentes da multiplicação das coordenadas de seus vértices por um número inteiro.
EF07MA20 | Geometria. Transformações geométricas de polígonos no plano cartesiano: multiplicação das coordenadas por um número inteiro e obtenção de simétricos em relação aos eixos e à origem | Reconhecer e representar, no plano cartesiano, o simétrico de figuras em relação aos eixos e à origem.
EF07MA21 | Geometria. Simetrias de translação, rotação e reflexão | Reconhecer e construir figuras obtidas por simetrias de translação, rotação e reflexão, usando instrumentos de desenho ou softwares de geometria dinâmica e vincular esse estudo a representações planas de obras de arte, elementos arquitetônicos, entre outros.
EF07MA22 | Geometria. A circunferência como lugar geométrico | Construir circunferências, utilizando compasso, reconhecê-las como lugar geométrico e utilizá-las para fazer composições artísticas e resolver problemas que envolvam objetos equidistantes.
EF07MA23 | Geometria. Relações entre os ângulos formados por retas paralelas intersectadas por uma transversal | Verificar relações entre os ângulos formados por retas paralelas cortadas por uma transversal, com e sem uso de softwares de geometria dinâmica.
EF07MA24 | Geometria. Triângulos: construção, condição de existência e soma das medidas dos ângulos internos | Construir triângulos, usando régua e compasso, reconhecer a condição de existência do triângulo quanto à medida dos lados e verificar que a soma das medidas dos ângulos internos de um triângulo é 180°.
EF07MA25 | Geometria. Triângulos: construção, condição de existência e soma das medidas dos ângulos internos | Reconhecer a rigidez geométrica dos triângulos e suas aplicações, como na construção de estruturas arquitetônicas (telhados, estruturas metálicas e outras) ou nas artes plásticas.
EF07MA26 | Geometria. Triângulos: construção, condição de existência e soma das medidas dos ângulos internos | Descrever, por escrito e por meio de um fluxograma, um algoritmo para a construção de um triângulo qualquer, conhecidas as medidas dos três lados.
EF07MA27 | Geometria. Polígonos regulares: quadrado e triângulo equilátero | Calcular medidas de ângulos internos de polígonos regulares, sem o uso de fórmulas, e estabelecer relações entre ângulos internos e externos de polígonos, preferencialmente vinculadas à construção de mosaicos e de ladrilhamentos.
EF07MA28 | Geometria. Polígonos regulares: quadrado e triângulo equilátero | Descrever, por escrito e por meio de um fluxograma, um algoritmo para a construção de um polígono regular (como quadrado e triângulo equilátero), conhecida a medida de seu lado.
EF07MA29 | Grandezas e medidas. Problemas envolvendo medições | Resolver e elaborar problemas que envolvam medidas de grandezas inseridos em contextos oriundos de situações cotidianas ou de outras áreas do conhecimento, reconhecendo que toda medida empírica é aproximada.
EF07MA30 | Grandezas e medidas. Cálculo de volume de blocos retangulares, utilizando unidades de medida convencionais mais usuais | Resolver e elaborar problemas de cálculo de medida do volume de blocos retangulares, envolvendo as unidades usuais (metro cúbico, decímetro cúbico e centímetro cúbico).
EF07MA31 | Grandezas e medidas. Equivalência de área de figuras planas: cálculo de áreas de figuras que podem ser decompostas por outras, cujas áreas podem ser facilmente determinadas como triângulos e quadriláteros | Estabelecer expressões de cálculo de área de triângulos e de quadriláteros.
EF07MA32 | Grandezas e medidas. Equivalência de área de figuras planas: cálculo de áreas de figuras que podem ser decompostas por outras, cujas áreas podem ser facilmente determinadas como triângulos e quadriláteros | Resolver e elaborar problemas de cálculo de medida de área de figuras planas que podem ser decompostas por quadrados, retângulos e/ou triângulos, utilizando a equivalência entre áreas.
EF07MA33 | Grandezas e medidas. Medida do comprimento da circunferência | Estabelecer o número π como a razão entre a medida de uma circunferência e seu diâmetro, para compreender e resolver problemas, inclusive os de natureza histórica.
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
