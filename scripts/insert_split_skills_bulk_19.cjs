const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF89LP01 | Reconstrução do contexto de produção, circulação e recepção de textos. Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Analisar os interesses que movem o campo jornalístico, os efeitos das novas tecnologias no campo e as condições que fazem da informação uma mercadoria, de forma a poder desenvolver uma atitude crítica frente aos textos jornalísticos.
EF08LP01 | Reconstrução do contexto de produção, circulação e recepção de textos. Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Identificar e comparar as várias editorias de jornais impressos e digitais e de sites noticiosos, de forma a refletir sobre os tipos de fato que são noticiados e comentados, as escolhas sobre o que noticiar e o que não noticiar e o destaque/enfoque dado e a fidedignidade da informação.
EF09LP01 | Reconstrução do contexto de produção, circulação e recepção de textos. Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Analisar o fenômeno da disseminação de notícias falsas nas redes sociais e desenvolver estratégias para reconhecê-las, a partir da verificação/avaliação do veículo, fonte, data e local da publicação, autoria, URL, da análise da formatação, da comparação de diferentes fontes, da consulta a sites de curadoria que atestam a fidedignidade do relato dos fatos e denunciam boatos etc.
EF89LP02 | Reconstrução do contexto de produção, circulação e recepção de textos. Caracterização do campo jornalístico e relação entre os gêneros em circulação, mídias e práticas da cultura digital | Analisar diferentes práticas (curtir, compartilhar, comentar, curar etc.) e textos pertencentes a diferentes gêneros da cultura digital (meme, gif, comentário, charge digital etc.) envolvidos no trato com a informação e opinião, de forma a possibilitar uma presença mais crítica e ética nas redes.
EF89LP03 | Estratégia de leitura: apreender os sentidos globais do texto. Apreciação e réplica | Analisar textos de opinião (artigos de opinião, editoriais, cartas de leitores, comentários, posts de blog e de redes sociais, charges, memes, gifs etc.) e posicionar-se de forma crítica e fundamentada, ética e respeitosa frente a fatos e opiniões relacionados a esses textos.
EF08LP02 | Relação entre textos | Justificar diferenças ou semelhanças no tratamento dado a uma mesma informação veiculada em textos diferentes, consultando sites e serviços de checadores de fatos.
EF09LP02 | Relação entre textos | Analisar e comentar a cobertura da imprensa sobre fatos de relevância social, comparando diferentes enfoques por meio do uso de ferramentas de curadoria.
EF89LP04 | Estratégia de leitura: apreender os sentidos globais do texto. Apreciação e réplica | Identificar e avaliar teses/opiniões/posicionamentos explícitos e implícitos, argumentos e contra-argumentos em textos argumentativos do campo (carta de leitor, comentário, artigo de opinião, resenha crítica etc.), posicionando-se frente à questão controversa de forma sustentada.
EF89LP05 | Efeitos de sentido | Analisar o efeito de sentido produzido pelo uso, em textos, de recurso a formas de apropriação textual (paráfrases, citações, discurso direto, indireto ou indireto livre).
EF89LP06 | Efeitos de sentido | Analisar o uso de recursos persuasivos em textos argumentativos diversos (como a elaboração do título, escolhas lexicais, construções metafóricas, a explicitação ou a ocultação de fontes de informação) e seus efeitos de sentido.
EF89LP07 | Efeitos de sentido. Exploração da multissemiose | Analisar, em notícias, reportagens e peças publicitárias em várias mídias, os efeitos de sentido devidos ao tratamento e à composição dos elementos nas imagens em movimento, à performance, à montagem feita (ritmo, duração e sincronização entre as linguagens – complementaridades, interferências etc.) e ao ritmo, melodia, instrumentos e sampleamentos das músicas e efeitos sonoros.
`;

async function importSkills() {
    const lines = rawData.trim().split('\n');
    const skillsToInsert = [];

    for (let line of lines) {
        if (!line.trim()) continue;

        // Split by the pipe character and trim whitespace
        const parts = line.split('|').map(p => p.trim());

        if (parts.length >= 3) {
            const code = parts[0];
            const knowledgeObject = parts[1];
            const description = parts.slice(2).join(' | ');

            const yearMatch = code.match(/EF(\d{2})/);

            // Not using backticks to avoid escaping syntax issues
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF00";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({
                code: code,
                description: fullDescription,
                subject: "LÍNGUA PORTUGUESA",
                year_range: year_range
            });
        }
    }

    if (skillsToInsert.length === 0) {
        console.log("Nenhuma habilidade encontrada para inserir.");
        return;
    }

    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");

    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Erro na inserção:", error);
    } else {
        const count = result ? result.length : 0;
        console.log("Sucesso! Foram inseridas/atualizadas " + count + " habilidades no banco separadas corretamente!");
    }
}

importSkills();
