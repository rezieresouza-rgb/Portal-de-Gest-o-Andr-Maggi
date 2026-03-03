const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06LI01 | EIXO ORALIDADE. Interação discursiva. Construção de laços afetivos e convívio social | Interagir em situações de intercâmbio oral, demonstrando iniciativa para utilizar a língua inglesa.
EF06LI02 | EIXO ORALIDADE. Interação discursiva. Construção de laços afetivos e convívio social | Coletar informações do grupo, perguntando e respondendo sobre a família, os amigos, a escola e a comunidade.
EF06LI03 | EIXO ORALIDADE. Interação discursiva. Funções e usos da língua inglesa em sala de aula (Classroom language) | Solicitar esclarecimentos em língua inglesa sobre o que não entendeu e o significado de palavras ou expressões desconhecidas.
EF06LI04 | EIXO ORALIDADE. Compreensão oral. Estratégias de compreensão de textos orais: palavras cognatas e pistas do contexto discursivo | Reconhecer, com o apoio de palavras cognatas e pistas do contexto discursivo, o assunto e as informações principais em textos orais sobre temas familiares.
EF06LI05 | EIXO ORALIDADE. Produção oral. Produção de textos orais, com a mediação do professor | Aplicar os conhecimentos da língua inglesa para falar de si e de outras pessoas, explicitando informações pessoais e características relacionadas a gostos, preferências e rotinas.
EF06LI06 | EIXO ORALIDADE. Produção oral. Produção de textos orais, com a mediação do professor | Planejar apresentação sobre a família, a comunidade e a escola, compartilhando-a oralmente com o grupo.
EF06LI07 | EIXO LEITURA. Estratégias de leitura. Hipóteses sobre a finalidade de um texto | Formular hipóteses sobre a finalidade de um texto em língua inglesa, com base em sua estrutura, organização textual e pistas gráficas.
EF06LI08 | EIXO LEITURA. Estratégias de leitura. Compreensão geral e específica: leitura rápida (skimming, scanning) | Identificar o assunto de um texto, reconhecendo sua organização textual e palavras cognatas.
EF06LI09 | EIXO LEITURA. Estratégias de leitura. Compreensão geral e específica: leitura rápida (skimming, scanning) | Localizar informações específicas em texto.
EF06LI10 | EIXO LEITURA. Práticas de leitura e construção de repertório lexical. Construção de repertório lexical e autonomia leitora | Conhecer a organização de um dicionário bilíngue (impresso e/ou on-line) para construir repertório lexical.
EF06LI11 | EIXO LEITURA. Práticas de leitura e construção de repertório lexical. Construção de repertório lexical e autonomia leitora | Explorar ambientes virtuais e/ou aplicativos para construir repertório lexical na língua inglesa.
EF06LI12 | EIXO LEITURA. Atitudes e disposições favoráveis do leitor. Partilha de leitura, com mediação do professor | Interessar-se pelo texto lido, compartilhando suas ideias sobre o que o texto informa/comunica.
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

            // Storing as LÍNGUA INGLESA to match dropdown in TeacherLessonPlan.tsx
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
