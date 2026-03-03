const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF69AR16 | Música. Contextos e práticas | Analisar criticamente, por meio da apreciação musical, usos e funções da música em seus contextos de produção e circulação, relacionando as práticas musicais às diferentes dimensões da vida social, cultural, política, histórica, econômica, estética e ética.
EF69AR17 | Música. Contextos e práticas | Explorar e analisar, criticamente, diferentes meios e equipamentos culturais de circulação da música e do conhecimento musical.
EF69AR18 | Música. Contextos e práticas | Reconhecer e apreciar o papel de músicos e grupos de música brasileiros e estrangeiros que contribuíram para o desenvolvimento de formas e gêneros musicais.
EF69AR19 | Música. Contextos e práticas | Identificar e analisar diferentes estilos musicais, contextualizando-os no tempo e no espaço, de modo a aprimorar a capacidade de apreciação de estética musical.
EF69AR20 | Música. Elementos da linguagem | Explorar e analisar elementos constitutivos da música (altura, intensidade, timbre, melodia, ritmo etc.), por meio de recursos tecnológicos (games e plataformas digitais), jogos, canções e práticas diversas de composição/criação, execução e apreciação musicais.
EF69AR21 | Música. Materialidades | Explorar e analisar formas e materiais sonoros em práticas de composição/criação, execução e apreciação musical, reconhecendo timbres e características de instrumentos musicais diversos.
EF69AR22 | Música. Notação e registro musical | Explorar e identificar diferentes formas de registro musical (notação musical tradicional, partituras criativas e procedimentos de música contemporânea), bem como procedimentos e técnicas de registro em áudio e audiovisual.
EF69AR23 | Música. Processos de criação | Explorar e criar improvisações, composições, arranjos, jingles, trilhas sonoras, dentre outros, utilizando vozes, sons corporais e/ou instrumentos acústicos ou eletrônicos, convencionais ou não convencionais, expressando ideias musicais de maneira individual, coletiva e colaborativa.
EF69AR24 | Teatro. Contextos e práticas | Reconhecer e apreciar artistas e grupos de teatro brasileiros e estrangeiros de diferentes épocas, investigando os modos de criação, produção, divulgação, circulação e organização da atuação profissional em teatro.
EF69AR25 | Teatro. Contextos e práticas | Identificar e analisar diferentes estilos cênicos, contextualizando-os no tempo e no espaço, de modo a aprimorar a capacidade de apreciação de estética teatral.
EF69AR26 | Teatro. Elementos da linguagem | Explorar diferentes elementos envolvidos na composição dos acontecimentos cênicos (figurinos, adereços, cenário, iluminação e sonoplastia) e reconhecer seus vocabulários.
EF69AR27 | Teatro. Processos de criação | Pesquisar e criar formas de dramaturgia e espaços cênicos para o acontecimento teatral, em diálogo com o teatro contemporâneo.
EF69AR28 | Teatro. Processos de criação | Investigar e experimentar diferentes funções teatrais e discutir os limites e desafios do trabalho artístico coletivo e colaborativo.
EF69AR29 | Teatro. Processos de criação | Experimentar a teatralidade e as construções corporais e vocais de maneira imaginativa na improvisação teatral e no jogo cênico.
EF69AR30 | Teatro. Processos de criação | Compor improvisações e acontecimentos cênicos com base em textos dramáticos e outros estímulos (música, imagens, objetos etc.), caracterizando personagens (com figurinos e adereços), cenário, iluminação e sonoplastia e considerando a relação com o espectador.
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
