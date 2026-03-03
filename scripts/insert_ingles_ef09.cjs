const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF09LI01 | EIXO ORALIDADE. Interação discursiva. Funções e usos da língua inglesa: persuasão | Fazer uso da língua inglesa para expor pontos de vista, argumentos e contra-argumentos, considerando o contexto e os recursos linguísticos voltados para a eficácia da comunicação.
EF09LI02 | EIXO ORALIDADE. Compreensão oral. Compreensão de textos orais, multimodais, de cunho argumentativo | Compilar as ideias-chave de textos por meio de tomada de notas.
EF09LI03 | EIXO ORALIDADE. Compreensão oral. Compreensão de textos orais, multimodais, de cunho argumentativo | Analisar posicionamentos defendidos e refutados em textos orais sobre temas de interesse social e coletivo.
EF09LI04 | EIXO ORALIDADE. Produção oral. Produção de textos orais com autonomia | Expor resultados de pesquisa ou estudo com o apoio de recursos, tais como notas, gráficos, tabelas, entre outros, adequando as estratégias de construção do texto oral aos objetivos de comunicação e ao contexto.
EF09LI05 | EIXO LEITURA. Estratégias de leitura. Recursos de persuasão | Identificar recursos de persuasão (escolha e jogo de palavras, uso de cores e imagens, tamanho de letras), utilizados nos textos publicitários e de propaganda, como elementos de convencimento.
EF09LI06 | EIXO LEITURA. Estratégias de leitura. Recursos de argumentação | Distinguir fatos de opiniões em textos argumentativos da esfera jornalística.
EF09LI07 | EIXO LEITURA. Estratégias de leitura. Recursos de argumentação | Identificar argumentos principais e as evidências/exemplos que os sustentam.
EF09LI08 | EIXO LEITURA. Práticas de leitura e novas tecnologias. Informações em ambientes virtuais | Explorar ambientes virtuais de informação e socialização, analisando a qualidade e a validade das informações veiculadas.
EF09LI09 | EIXO LEITURA. Avaliação dos textos lidos. Reflexão pós-leitura | Compartilhar, com os colegas, a leitura dos textos escritos pelo grupo, valorizando os diferentes pontos de vista defendidos, com ética e respeito.
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
