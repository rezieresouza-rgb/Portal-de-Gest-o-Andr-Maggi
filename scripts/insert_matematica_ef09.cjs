const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF09MA01 | Números. Necessidade dos números reais para medir qualquer segmento de reta. Números irracionais: reconhecimento e localização de alguns na reta numérica | Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional (como as medidas de diagonais de um polígono e alturas de um triângulo, quando se toma a medida de cada lado como unidade).
EF09MA02 | Números. Números irracionais: reconhecimento e localização de alguns na reta numérica | Reconhecer um número irracional como um número real cuja representação decimal é infinita e não periódica, e estimar a localização de alguns deles na reta numérica.
EF09MA03 | Números. Potências com expoentes negativos e fracionários | Efetuar cálculos com números reais, inclusive potências com expoentes fracionários.
EF09MA04 | Números. Números reais: notação científica e problemas | Resolver e elaborar problemas com números reais, inclusive em notação científica, envolvendo diferentes operações.
EF09MA05 | Números. Porcentagens: problemas que envolvem cálculo de percentuais sucessivos | Resolver e elaborar problemas que envolvam porcentagens, com a ideia de aplicação de percentuais sucessivos e a determinação das taxas percentuais, preferencialmente com o uso de tecnologias digitais, no contexto da educação financeira.
EF09MA06 | Álgebra. Funções: representações numérica, algébrica e gráfica | Compreender as funções como relações de dependência unívoca entre duas variáveis e suas representações numérica, algébrica e gráfica e utilizar esse conceito para analisar situações que envolvam relações funcionais entre duas variáveis.
EF09MA07 | Álgebra. Razão entre grandezas de espécies diferentes | Resolver problemas que envolvam a razão entre duas grandezas de espécies diferentes, como velocidade e densidade demográfica.
EF09MA08 | Álgebra. Grandezas diretamente proporcionais e grandezas inversamente proporcionais | Resolver e elaborar problemas que envolvam relações de proporcionalidade direta e inversa entre duas ou mais grandezas, inclusive escalas, divisão em partes proporcionais e taxa de variação, em contextos socioculturais, ambientais e de outras áreas.
EF09MA09 | Álgebra. Expressões algébricas: fatoração e produtos notáveis. Resolução de equações polinomiais do 2º grau por meio de fatorações | Compreender os processos de fatoração de expressões algébricas, com base em suas relações com os produtos notáveis, para resolver e elaborar problemas que possam ser representados por equações polinomiais do 2º grau.
EF09MA10 | Geometria. Demonstrações de relações entre os ângulos formados por retas paralelas intersectadas por uma transversal | Demonstrar relações simples entre os ângulos formados por retas paralelas cortadas por uma transversal.
EF09MA11 | Geometria. Relações entre arcos e ângulos na circunferência de um círculo | Resolver problemas por meio do estabelecimento de relações entre arcos, ângulos centrais e ângulos inscritos na circunferência, fazendo uso, inclusive, de softwares de geometria dinâmica.
EF09MA12 | Geometria. Semelhança de triângulos | Reconhecer as condições necessárias e suficientes para que dois triângulos sejam semelhantes.
EF09MA13 | Geometria. Relações métricas no triângulo retângulo. Teorema de Pitágoras: verificações experimentais e demonstração | Demonstrar relações métricas do triângulo retângulo, entre elas o teorema de Pitágoras, utilizando, inclusive, a semelhança de triângulos.
EF09MA14 | Geometria. Retas paralelas cortadas por transversais: teoremas de proporcionalidade e verificações experimentais | Resolver e elaborar problemas de aplicação do teorema de Pitágoras ou das relações de proporcionalidade envolvendo retas paralelas cortadas por secantes.
EF09MA15 | Geometria. Polígonos regulares | Descrever, por escrito e por meio de um fluxograma, um algoritmo para a construção de um polígono regular cuja medida do lado é conhecida, utilizando régua e compasso, como também softwares.
EF09MA16 | Geometria. Distância entre pontos no plano cartesiano | Determinar o ponto médio de um segmento de reta e a distância entre dois pontos quaisquer, dadas as coordenadas desses pontos no plano cartesiano, sem o uso de fórmulas, e utilizar esse conhecimento para calcular, por exemplo, medidas de perímetros e áreas de figuras planas construídas no plano.
EF09MA17 | Geometria. Vistas ortogonais de figuras espaciais | Reconhecer vistas ortogonais de figuras espaciais e aplicar esse conhecimento para desenhar objetos em perspectiva.
EF09MA18 | Grandezas e medidas. Unidades de medida para medir distâncias muito grandes e muito pequenas. Unidades de medida utilizadas na informática | Reconhecer e empregar unidades usadas para expressar medidas muito grandes ou muito pequenas, tais como distância entre planetas e sistemas solares, tamanho de vírus ou de células, capacidade de armazenamento de computadores, entre outros.
EF09MA19 | Grandezas e medidas. Volume de prismas e cilindros | Resolver e elaborar problemas que envolvam medidas de volumes de prismas e de cilindros retos, inclusive com uso de expressões de cálculo, em situações cotidianas.
EF09MA20 | Probabilidade e estatística. Análise de probabilidade de eventos aleatórios: eventos dependentes e independentes | Reconhecer, em experimentos aleatórios, eventos independentes e dependentes e calcular a probabilidade de sua ocorrência, nos dois casos.
EF09MA21 | Probabilidade e estatística. Análise de gráficos divulgados pela mídia: elementos que podem induzir a erros de leitura ou de interpretação | Analisar e identificar, em gráficos divulgados pela mídia, os elementos que podem induzir, às vezes propositadamente, erros de leitura, como escalas inapropriadas, legendas não explicitadas corretamente, omissão de informações importantes (fontes e datas), entre outros.
EF09MA22 | Probabilidade e estatística. Leitura, interpretação e representação de dados de pesquisa expressos em tabelas de dupla entrada, gráficos de colunas simples e agrupadas, gráficos de barras e de setores e gráficos pictóricos | Escolher e construir o gráfico mais adequado (colunas, setores, linhas), com ou sem uso de planilhas eletrônicas, para apresentar um determinado conjunto de dados, destacando aspectos como as medidas de tendência central.
EF09MA23 | Probabilidade e estatística. Planejamento e execução de pesquisa amostral e apresentação de relatório | Planejar e executar pesquisa amostral envolvendo tema da realidade social e comunicar os resultados por meio de relatório contendo avaliação de medidas de tendência central e da amplitude, tabelas e gráficos adequados, construídos com o apoio de planilhas eletrônicas.
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
