const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69AR01 | Artes visuais. Contextos e práticas | Pesquisar, apreciar e analisar formas distintas das artes visuais tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros de diferentes épocas e em diferentes matrizes estéticas e culturais, de modo a ampliar a experiência com diferentes contextos e práticas artístico-visuais e cultivar a percepção, o imaginário, a capacidade de simbolizar e o repertório imagético.
EF69AR02 | Artes visuais. Contextos e práticas | Pesquisar e analisar diferentes estilos visuais, contextualizando-os no tempo e no espaço.
EF69AR03 | Artes visuais. Contextos e práticas | Analisar situações nas quais as linguagens das artes visuais se integram às linguagens audiovisuais (cinema, animações, vídeos etc.), gráficas (capas de livros, ilustrações de textos diversos etc.), cenográficas, coreográficas, musicais etc.
EF69AR04 | Artes visuais. Elementos da linguagem | Analisar os elementos constitutivos das artes visuais (ponto, linha, forma, direção, cor, tom, escala, dimensão, espaço, movimento etc.) na apreciação de diferentes produções artísticas.
EF69AR05 | Artes visuais. Materialidades | Experimentar e analisar diferentes formas de expressão artística (desenho, pintura, colagem, quadrinhos, dobradura, escultura, modelagem, instalação, vídeo, fotografia, performance etc.).
EF69AR06 | Artes visuais. Processos de criação | Desenvolver processos de criação em artes visuais, com base em temas ou interesses artísticos, de modo individual, coletivo e colaborativo, fazendo uso de materiais, instrumentos e recursos convencionais, alternativos e digitais.
EF69AR07 | Artes visuais. Processos de criação | Dialogar com princípios conceituais, proposições temáticas, repertórios imagéticos e processos de criação nas suas produções visuais.
EF69AR08 | Artes visuais. Sistemas da linguagem | Diferenciar as categorias de artista, artesão, produtor cultural, curador, designer, entre outras, estabelecendo relações entre os profissionais do sistema das artes visuais.
EF69AR09 | Dança. Contextos e práticas | Pesquisar e analisar diferentes formas de expressão, representação e encenação da dança, reconhecendo e apreciando composições de dança de artistas e grupos brasileiros e estrangeiros de diferentes épocas.
EF69AR10 | Dança. Elementos da linguagem | Explorar elementos constitutivos do movimento cotidiano e do movimento dançado, abordando, criticamente, o desenvolvimento das formas da dança em sua história tradicional e contemporânea.
EF69AR11 | Dança. Elementos da linguagem | Experimentar e analisar os fatores de movimento (tempo, peso, fluência e espaço) como elementos que, combinados, geram as ações corporais e o movimento dançado.
EF69AR12 | Dança. Processos de criação | Investigar e experimentar procedimentos de improvisação e criação do movimento como fonte para a construção de vocabulários e repertórios próprios.
EF69AR13 | Dança. Processos de criação | Investigar brincadeiras, jogos, danças coletivas e outras práticas de dança de diferentes matrizes estéticas e culturais como referência para a criação e a composição de danças autorais, individualmente e em grupo.
EF69AR14 | Dança. Processos de criação | Analisar e experimentar diferentes elementos (figurino, iluminação, cenário, trilha sonora etc.) e espaços (convencionais e não convencionais) para composição cênica e apresentação coreográfica.
EF69AR15 | Dança. Processos de criação | Discutir as experiências pessoais e coletivas em dança vivenciadas na escola e em outros contextos, problematizando estereótipos e preconceitos.
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
            skillsToInsert.push({ code, description: fullDescription, subject: "ARTES", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
