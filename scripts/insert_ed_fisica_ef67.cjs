const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF67EF01 | Brincadeiras e jogos. Jogos eletrônicos | Experimentar e fruir, na escola e fora dela, jogos eletrônicos diversos, valorizando e respeitando os sentidos e significados atribuídos a eles por diferentes grupos sociais e etários.
EF67EF02 | Brincadeiras e jogos. Jogos eletrônicos | Identificar as transformações nas características dos jogos eletrônicos em função dos avanços das tecnologias e nas respectivas exigências corporais colocadas por esses diferentes tipos de jogos.
EF67EF03 | Esportes. Esportes de marca, precisão, invasão e técnico-combinatórios | Experimentar e fruir esportes de marca, precisão, invasão e técnico-combinatórios, valorizando o trabalho coletivo e o protagonismo.
EF67EF04 | Esportes. Esportes de marca, precisão, invasão e técnico-combinatórios | Praticar um ou mais esportes de marca, precisão, invasão e técnico-combinatórios oferecidos pela escola, usando habilidades técnico-táticas básicas e respeitando regras.
EF67EF05 | Esportes. Esportes de marca, precisão, invasão e técnico-combinatórios | Planejar e utilizar estratégias para solucionar os desafios técnicos e táticos, tanto nos esportes de marca, precisão, invasão e técnico-combinatórios como nas modalidades esportivas escolhidas para praticar de forma específica.
EF67EF06 | Esportes. Esportes de marca, precisão, invasão e técnico-combinatórios | Analisar as transformações na organização e na prática dos esportes em suas diferentes manifestações (profissional e comunitário/lazer).
EF67EF07 | Esportes. Esportes de marca, precisão, invasão e técnico-combinatórios | Propor e produzir alternativas para experimentação dos esportes não disponíveis e/ou acessíveis na comunidade e das demais práticas corporais tematizadas na escola.
EF67EF08 | Ginásticas. Ginástica de condicionamento físico | Experimentar e fruir exercícios físicos que solicitem diferentes capacidades físicas, identificando seus tipos (força, velocidade, resistência, flexibilidade) e as sensações corporais provocadas pela sua prática.
EF67EF09 | Ginásticas. Ginástica de condicionamento físico | Construir, coletivamente, procedimentos e normas de convívio que viabilizem a participação de todos na prática de exercícios físicos, com o objetivo de promover a saúde.
EF67EF10 | Ginásticas. Ginástica de condicionamento físico | Diferenciar exercício físico de atividade física e propor alternativas para a prática de exercícios físicos dentro e fora do ambiente escolar.
EF67EF11 | Danças. Danças urbanas | Experimentar, fruir e recriar danças urbanas, identificando seus elementos constitutivos (ritmo, espaço, gestos).
EF67EF12 | Danças. Danças urbanas | Planejar e utilizar estratégias para aprender elementos constitutivos das danças urbanas.
EF67EF13 | Danças. Danças urbanas | Diferenciar as danças urbanas das demais manifestações da dança, valorizando e respeitando os sentidos e significados atribuídos a eles por diferentes grupos sociais.
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

            // For Educação Física
            // Storing as EDUCAÇÃO FÍSICA to match the exact option in the dropdown of TeacherLessonPlan.tsx
            skillsToInsert.push({ code, description: fullDescription, subject: "EDUCAÇÃO FÍSICA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
