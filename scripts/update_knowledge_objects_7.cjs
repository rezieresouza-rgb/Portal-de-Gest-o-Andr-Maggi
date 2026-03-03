const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateKnowledgeObjects() {
    const mappings = [
        { code: 'EF69LP35', knowledgeObject: 'Consideração das condições de produção de textos de divulgação científica. Estratégias de escrita' },
        { code: 'EF69LP36', knowledgeObject: 'Estratégias de escrita: textualização, revisão e edição' },
        { code: 'EF69LP37', knowledgeObject: 'Estratégias de produção' },
        { code: 'EF69LP38', knowledgeObject: 'Estratégias de produção: planejamento e produção de apresentações orais' },
        { code: 'EF69LP39', knowledgeObject: 'Estratégias de produção' }
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
            // Remove any existing prefix to avoid stacking
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
