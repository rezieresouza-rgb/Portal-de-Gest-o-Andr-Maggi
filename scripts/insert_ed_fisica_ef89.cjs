const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89EF01 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Experimentar diferentes papéis (jogador, árbitro e técnico) e fruir os esportes de rede/parede, campo e taco, invasão e combate, valorizando o trabalho coletivo e o protagonismo.
EF89EF02 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Praticar um ou mais esportes de rede/parede, campo e taco, invasão e combate oferecidos pela escola, usando habilidades técnico-táticas básicas.
EF89EF03 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Formular e utilizar estratégias para solucionar os desafios técnicos e táticos, tanto nos esportes de campo e taco, rede/parede, invasão e combate como nas modalidades esportivas escolhidas para praticar de forma específica.
EF89EF04 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Identificar os elementos técnicos ou técnico-táticos individuais, combinações táticas, sistemas de jogo e regras das modalidades esportivas praticadas, bem como diferenciar as modalidades esportivas com base nos critérios da lógica interna das categorias de esporte: rede/parede, campo e taco, invasão e combate.
EF89EF05 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Identificar as transformações históricas do fenômeno esportivo e discutir alguns de seus problemas (doping, corrupção, violência etc.) e a forma como as mídias os apresentam.
EF89EF06 | Esportes. Esportes de rede/parede, campo e taco, invasão e combate | Verificar locais disponíveis na comunidade para a prática de esportes e das demais práticas corporais tematizadas na escola, propondo e produzindo alternativas para utilizá-los no tempo livre.
EF89EF07 | Ginásticas. Ginástica de condicionamento físico e Ginástica de conscientização corporal | Experimentar e fruir um ou mais programas de exercícios físicos, identificando as exigências corporais desses diferentes programas e reconhecendo a importância de uma prática individualizada, adequada às características e necessidades de cada sujeito.
EF89EF08 | Ginásticas. Ginástica de condicionamento físico e Ginástica de conscientização corporal | Discutir as transformações históricas dos padrões de desempenho, saúde e beleza, considerando a forma como são apresentados nos diferentes meios (científico, midiático etc.).
EF89EF09 | Ginásticas. Ginástica de condicionamento físico e Ginástica de conscientização corporal | Problematizar a prática excessiva de exercícios físicos e o uso de medicamentos para a ampliação do rendimento ou potencialização das transformações corporais.
EF89EF10 | Ginásticas. Ginástica de condicionamento físico e Ginástica de conscientização corporal | Experimentar e fruir um ou mais tipos de ginástica de conscientização corporal, identificando as exigências corporais dos mesmos.
EF89EF11 | Ginásticas. Ginástica de condicionamento físico e Ginástica de conscientização corporal | Identificar as diferenças e semelhanças entre a ginástica de conscientização corporal e as de condicionamento físico e discutir como a prática de cada uma dessas manifestações pode contribuir para a melhoria das condições de vida, saúde, bem-estar e cuidado consigo mesmo.
EF89EF12 | Danças. Danças de salão | Experimentar, fruir e recriar danças de salão, valorizando a diversidade cultural e respeitando a tradição dessas culturas.
EF89EF13 | Danças. Danças de salão | Planejar e utilizar estratégias para se apropriar dos elementos constitutivos (ritmo, espaço, gestos) das danças de salão.
EF89EF14 | Danças. Danças de salão | Discutir estereótipos e preconceitos relativos às danças de salão e demais práticas corporais e propor alternativas para sua superação.
EF89EF15 | Danças. Danças de salão | Analisar as características (ritmos, gestos, coreografias e músicas) das danças de salão, bem como suas transformações históricas e os grupos de origem.
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
