const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP12 | Estratégias de produção: planejamento e participação em debates regrados | Planejar coletivamente a realização de um debate sobre tema previamente definido, de interesse coletivo, com regras acordadas e planejar, em grupo, participação em debate a partir do levantamento de informações e argumentos que possam sustentar o posicionamento a ser defendido (o que pode envolver entrevistas com especialistas, consultas a fontes diversas, o registro das informações e dados obtidos etc.), tendo em vista as condições de produção do debate – perfil dos ouvintes e demais participantes, objetivos do debate, motivações para sua realização, argumentos e estratégias de convencimento mais eficazes etc. e participar de debates regrados, na condição de membro de uma equipe de debatedores, apresentador/mediador, espectador (com ou sem direito a perguntas) e/ou de juiz/avaliador, como forma de compreender o funcionamento do debate e poder participar de forma convincente, ética, respeitosa e crítica e desenvolver uma atitude de respeito ao diálogo e com as ideias divergentes.
EF89LP13 | Estratégias de produção: planejamento, realização e edição de entrevistas orais | Planejar entrevistas orais com pessoas ligadas ao fato noticiado, especialistas etc., como forma de obter dados e informações sobre os fatos cobertos sobre o tema ou questão discutida ou temáticas em estudo, levando em conta o gênero e seu contexto de produção, partindo do levantamento de informações sobre o entrevistado e sobre a temática e de elaboração de um roteiro de perguntas, garantindo a relevância das informações mantidas e a continuidade temática, realizar entrevista e fazer edição em áudio ou vídeo, incluindo uma contextualização inicial e uma fala de encerramento para publicação da entrevista isoladamente ou como parte integrante de reportagem multimidiática, adequando-a a seu contexto de publicação e garantindo a relevância das informações mantidas e a continuidade temática.
EF89LP14 | Argumentação: movimentos argumentativos, tipos de argumento e força argumentativa | Analisar, em textos argumentativos e propositivos, os movimentos argumentativos de sustentação, refutação e negociação e os tipos de argumentos, avaliando a força/tipo dos argumentos utilizados.
EF89LP15 | Estilo | Utilizar, nos debates, recursos argumentativos que marcam a defesa da ideia e o diálogo com a tese do outro: concordo, discordo, concordo parcialmente, do meu ponto de vista, na perspectiva aqui assumida etc.
EF89LP16 | Modalização | Analisar a modalização em textos noticiosos e argumentativos, por meio das modalidades apreciativas, viabilizadas por classes e estruturas gramaticais como adjetivos, locuções adjetivas, advérbios, locuções adverbiais, orações adjetivas e adverbiais, orações relativas restritivas e explicativas etc., de maneira a perceber a apreciação ideológica sobre os fatos noticiados ou as posições implícitas ou assumidas.
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
