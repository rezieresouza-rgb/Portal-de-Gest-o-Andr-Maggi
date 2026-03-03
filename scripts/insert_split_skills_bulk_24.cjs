const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP32 | Relação entre textos | Analisar os efeitos de sentido decorrentes do uso de mecanismos de intertextualidade (referências, alusões, retomadas) entre os textos literários, entre esses textos literários e outras manifestações artísticas (cinema, teatro, artes visuais e midiáticas, música), quanto aos temas, personagens, estilos, autores etc., e entre o texto original e paródias, paráfrases, pastishes, trailer honesto, vídeos-minuto, vídelog, dentre outros.
EF89LP33 | Estratégias de leitura. Apreciação e réplica | Ler, de forma autônoma, e compreender – selecionando procedimentos e estratégias de leitura adequados a diferentes objetivos e levando em conta características dos gêneros e suportes – romances, contos contemporâneos, minicontos, fábulas contemporâneas, romances juvenis, biografias romanceadas, novelas, crônicas visuais, narrativas de ficção científica, narrativas de suspense, poemas de forma livre e fixa (como haicai), poema concreto, ciberpoemia, dentre outros, expressando avaliação sobre o texto lido e estabelecendo preferências por gêneros, temas, autores.
EF89LP34 | Reconstrução da textualidade e compreensão dos efeitos de sentidos provocados pelos usos de recursos linguísticos e multissemióticos | Analisar a organização de texto dramático apresentado em teatro, televisão, cinema, identificando e percebendo os sentidos decorrentes dos recursos linguísticos e semióticos que sustentam sua realização como peça teatral, novela, filme etc.
EF89LP35 | Construção da textualidade | Criar contos ou crônicas (em especial, líricas), crônicas visuais, minicontos, narrativas de aventura e de ficção científica, dentre outros, com temáticas próprias ao gênero, usando os conhecimentos sobre os constituintes estruturais e recursos expressivos típicos dos gêneros narrativos pretendidos, no caso de produção em grupo, ferramentas de escrita colaborativa.
EF89LP36 | Relação entre textos | Recriar poemas conhecidos da literatura e criar textos em versos (como poemas concretos, ciberpoemas, haicais, liras, micro-relatos, lambe-lambes e outros tipos de poemas), explorando o uso de recursos sonoros e semânticos (como figuras de linguagem e jogos de palavras) e visuais (como relações entre imagem e texto verbal e distribuição da mancha gráfica), de forma a propiciar diferentes efeitos de sentido.
EF08LP04 | Fono-ortografia | Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: ortografia, regências e concordâncias nominal e verbal, modos e tempos verbais, pontuação etc.
EF09LP04 | Fono-ortografia | Escrever textos corretamente, de acordo com a norma-padrão, com estruturas sintáticas complexas no nível da oração e do período.
EF08LP05 | Léxico/morfologia | Analisar processos de formação de palavras por composição (aglutinação e justaposição), apropriando-se de regras básicas de uso do hífen em palavras compostas.
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
