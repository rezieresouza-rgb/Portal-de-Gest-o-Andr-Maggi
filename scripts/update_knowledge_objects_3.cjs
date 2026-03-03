const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateKnowledgeObjects() {
    const mappings = [
        { code: 'EF69LP06', knowledgeObject: 'Relação do texto com o contexto de produção e experimentação de papéis sociais' },
        { code: 'EF69LP07', knowledgeObject: 'Textualização' },
        { code: 'EF69LP08', knowledgeObject: 'Revisão/edição de texto informativo e opinativo' },
        { code: 'EF69LP09', knowledgeObject: 'Planejamento de textos de peças publicitárias de campanhas sociais' },
        { code: 'EF69LP10', knowledgeObject: 'Produção de textos jornalísticos orais' },
        { code: 'EF69LP11', knowledgeObject: 'Produção de textos jornalísticos orais' }
    ];

    for (const mapping of mappings) {
        const { data, error } = await supabase
            .from('bncc_skills')
            .select('description')
            .eq('code', mapping.code)
            .single();

        if (error) {
            console.error(`Error finding skill ${mapping.code}:`, error.message);
            continue;
        }

        if (data && data.description) {
            let newDescription = data.description;
            newDescription = newDescription.replace(/^\[Objeto de Conhecimento: .*?\]\s*/i, '');
            newDescription = `[Objeto de Conhecimento: ${mapping.knowledgeObject}] ${newDescription}`;

            const { error: updateError } = await supabase
                .from('bncc_skills')
                .update({ description: newDescription })
                .eq('code', mapping.code);

            if (updateError) {
                console.error(`Error updating skill ${mapping.code}:`, updateError.message);
            } else {
                console.log(`Successfully updated ${mapping.code}`);
            }
        }
    }
}

updateKnowledgeObjects();
