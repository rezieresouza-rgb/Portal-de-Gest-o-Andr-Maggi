const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF07LI01 | EIXO ORALIDADE. Interação discursiva. Funções e usos da língua inglesa: convivência e colaboração em sala de aula | Interagir em situações de intercâmbio oral para realizar as atividades em sala de aula, de forma respeitosa e colaborativa, trocando ideias e engajando-se em brincadeiras e jogos.
EF07LI02 | EIXO ORALIDADE. Interação discursiva. Práticas investigativas | Entrevistar os colegas para conhecer suas histórias de vida.
EF07LI03 | EIXO ORALIDADE. Compreensão oral. Estratégias de compreensão de textos orais: conhecimentos prévios | Mobilizar conhecimentos prévios para compreender texto oral.
EF07LI04 | EIXO ORALIDADE. Compreensão oral. Compreensão de textos orais de cunho descritivo ou narrativo | Identificar o contexto, a finalidade, o assunto e os interlocutores em textos orais presentes no cinema, na internet, na televisão, entre outros.
EF07LI05 | EIXO ORALIDADE. Produção oral. Produção de textos orais, com mediação do professor | Compor, em língua inglesa, narrativas orais sobre fatos, acontecimentos e personalidades marcantes do passado.
EF07LI06 | EIXO LEITURA. Estratégias de leitura. Compreensão geral e específica: leitura rápida (skimming, scanning) | Antecipar o sentido global de textos em língua inglesa por inferências, com base em leitura rápida, observando títulos, primeiras e últimas frases de parágrafos e palavras-chave repetidas.
EF07LI07 | EIXO LEITURA. Estratégias de leitura. Compreensão geral e específica: leitura rápida (skimming, scanning) | Identificar a(s) informação(ões)-chave de partes de um texto em língua inglesa (parágrafos).
EF07LI08 | EIXO LEITURA. Estratégias de leitura. Construção do sentido global do texto | Relacionar as partes de um texto (parágrafos) para construir seu sentido global.
EF07LI09 | EIXO LEITURA. Práticas de leitura e pesquisa. Objetivos de leitura | Selecionar, em um texto, a informação desejada como objetivo de leitura.
EF07LI10 | EIXO LEITURA. Práticas de leitura e pesquisa. Leitura de textos digitais para estudo | Escolher, em ambientes virtuais, textos em língua inglesa, de fontes confiáveis, para estudos/pesquisas escolares.
EF07LI11 | EIXO LEITURA. Atitudes e disposições favoráveis do leitor. Partilha de leitura | Participar de troca de opiniões e informações sobre textos, lidos na sala de aula ou em outros ambientes.
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

            skillsToInsert.push({ code, description: fullDescription, subject: "LÍNGUA INGLESA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
