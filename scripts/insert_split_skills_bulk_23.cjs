const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP22 | Escuta. Apreender o sentido geral dos textos. Apreciação e réplica. Produção/Proposta | Compreender e comparar as diferentes posições e interesses em jogo em uma discussão ou apresentação de propostas, avaliando a validade e a força dos argumentos e as consequências do que está sendo proposto e, quando for o caso, formular e negociar propostas de diferentes naturezas relativas a interesses coletivos envolvendo a escola ou comunidade escolar.
EF89LP23 | Movimentos argumentativos e força dos argumentos | Analisar, em textos argumentativos, reivindicatórios e propositivos, os movimentos argumentativos utilizados (sustentação, refutação e negociação), avaliando a força dos argumentos utilizados.
EF89LP24 | Curadoria de informação | Realizar pesquisa, estabelecendo o recorte das questões, usando fontes abertas e confiáveis.
EF89LP25 | Estratégias de escrita: textualização, revisão e edição | Divulgar o resultado de pesquisas por meio de apresentações orais, verbetes de enciclopédias colaborativas, reportagens de divulgação científica, vlogs científicos, vídeos de diferentes tipos etc.
EF89LP26 | Estratégias de escrita: textualização, revisão e edição | Produzir resenhas, a partir das notas e/ou esquemas feitos, com o manejo adequado das vozes envolvidas (do resenhador, do autor da obra e, se for o caso, também dos autores citados na obra resenhada), por meio do uso de paráfrases, marcas do discurso reportado e citações.
EF89LP27 | Conversação espontânea | Tecer considerações e formular problematizações pertinentes, em momentos oportunos, em situações de aulas, apresentação oral, seminário etc.
EF89LP28 | Procedimentos de apoio à compreensão. Tomada de nota | Tomar nota de videoaulas, aulas digitais, apresentações multimídias, vídeos de divulgação científica, documentários e afins, identificando, em função dos objetivos, informações principais para apoio ao estudo e realizando, quando necessário, uma síntese final que destaque e reorganize os pontos ou conceitos centrais e suas relações e que, em alguns casos, seja acompanhada de reflexões pessoais, que podem conter dúvidas, questionamentos, considerações etc.
EF89LP29 | Textualização. Progressão temática | Utilizar e perceber mecanismos de progressão temática, tais como retomadas anafóricas ("que, cujo, onde", pronomes demonstrativos e oblíquos, pronomes demonstrativos, nomes correferentes etc.), catáforas (remetendo para adiante ao invés de retornar/já dito), uso de organizadores textuais, de operadores etc., e analisar os mecanismos de reformulação e paráfrase utilizados nos textos de divulgação do conhecimento.
EF89LP30 | Textualização | Analisar a estrutura de hipertexto e hiperlinks em textos de divulgação científica que circulam na Web e proceder à remissão a conceitos e relações por meio de links.
EF89LP31 | Modalização | Analisar e utilizar modalização epistêmica, isto é, modos de indicar uma avaliação sobre o valor de verdade e as condições de verdade de uma proposição, tais como os assertivos – quando se concorda com ("realmente, evidentemente, naturalmente, efetivamente, claro, certo, lógico, sem dúvida" etc.) ou discorda (de "de jeito nenhum, de forma alguma") uma ideia, e os quase-asseverativos, que indicam que o falante/autor considera o conteúdo como quase certo ("talvez, assim, possivelmente, provavelmente, eventualmente").
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
            skillsToInsert.push({ code, description: fullDescription, subject: "LÍNGUA PORTUGUESA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
