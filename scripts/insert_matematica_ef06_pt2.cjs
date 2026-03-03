const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06MA14 | Álgebra. Propriedades da igualdade | Reconhecer que a relação de igualdade matemática não se altera ao adicionar, subtrair, multiplicar ou dividir os seus dois membros por um mesmo número e utilizar essa noção para determinar valores desconhecidos na resolução de problemas.
EF06MA15 | Álgebra. Problemas que tratam da partição de um todo em duas partes desiguais, envolvendo razões entre as partes e entre uma das partes e o todo | Resolver e elaborar problemas que envolvam a partilha de uma quantidade em duas partes desiguais, envolvendo relações aditivas e multiplicativas, bem como a razão entre as partes e entre uma das partes e o todo.
EF06MA16 | Geometria. Plano cartesiano: associação dos vértices de um polígono a pares ordenados | Associar pares ordenados de números a pontos do plano cartesiano do 1º quadrante, em situações como a localização dos vértices de um polígono.
EF06MA17 | Geometria. Prismas e pirâmides: planificações e relações entre seus elementos (vértices, faces e arestas) | Quantificar e estabelecer relações entre o número de vértices, faces e arestas de prismas e pirâmides, em função do seu polígono da base, para resolver problemas e desenvolver a percepção espacial.
EF06MA18 | Geometria. Polígonos: classificações quanto ao número de vértices, às medidas de lados e ângulos e ao paralelismo e perpendicularismo dos lados | Reconhecer, nomear e comparar polígonos, considerando lados, vértices e ângulos, e classificá-los em regulares e não regulares, tanto em suas representações no plano como em faces de poliedros.
EF06MA19 | Geometria. Polígonos: classificações quanto ao número de vértices, às medidas de lados e ângulos e ao paralelismo e perpendicularismo dos lados | Identificar características dos triângulos e classificá-los em relação às medidas dos lados e dos ângulos.
EF06MA20 | Geometria. Polígonos: classificações quanto ao número de vértices, às medidas de lados e ângulos e ao paralelismo e perpendicularismo dos lados | Identificar características dos quadriláteros, classificá-los em relação a lados e a ângulos e reconhecer a inclusão e a intersecção de classes entre eles.
EF06MA21 | Geometria. Construção de figuras semelhantes: ampliação e redução de figuras planas em malhas quadriculadas | Construir figuras planas semelhantes em situações de ampliação e de redução, com o uso de malhas quadriculadas, plano cartesiano ou tecnologias digitais.
EF06MA22 | Geometria. Construção de retas paralelas e perpendiculares, fazendo uso de réguas, esquadros e softwares | Utilizar instrumentos, como réguas e esquadros, ou softwares para representações de retas paralelas e perpendiculares e construção de quadriláteros, entre outros.
EF06MA23 | Geometria. Construção de retas paralelas e perpendiculares, fazendo uso de réguas, esquadros e softwares | Construir algoritmo para resolver situações passo a passo (como na construção de dobraduras ou na indicação de deslocamento de um objeto no plano segundo pontos de referência e distâncias fornecidas etc.).
EF06MA24 | Grandezas e medidas. Problemas sobre medidas envolvendo grandezas como comprimento, massa, tempo, temperatura, área, capacidade e volume | Resolver e elaborar problemas que envolvam as grandezas comprimento, massa, tempo, temperatura, área (triângulos e retângulos), capacidade e volume (sólidos formados por blocos retangulares), sem uso de fórmulas, inseridos, sempre que possível, em contextos oriundos de situações reais e/ou relacionadas às outras áreas do conhecimento.
EF06MA25 | Grandezas e medidas. Ângulos: noção, usos e medida | Reconhecer a abertura do ângulo como grandeza associada às figuras geométricas.
EF06MA26 | Grandezas e medidas. Ângulos: noção, usos e medida | Resolver problemas que envolvam a noção de ângulo em diferentes contextos e em situações reais, como ângulo de visão.
EF06MA27 | Grandezas e medidas. Ângulos: noção, usos e medida | Determinar medidas da abertura de ângulos, por meio de transferidor e/ou tecnologias digitais.
EF06MA28 | Grandezas e medidas. Plantas baixas e vistas aéreas | Interpretar, descrever e desenhar plantas baixas simples de residências e vistas aéreas.
EF06MA29 | Grandezas e medidas. Perímetro de um quadrado como grandeza proporcional à medida do lado | Analisar e descrever mudanças que ocorrem no perímetro e na área de um quadrado ao se ampliarem ou reduzirem, igualmente, as medidas de seus lados, para compreender que o perímetro é proporcional à medida do lado, o que não ocorre com a área.
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
