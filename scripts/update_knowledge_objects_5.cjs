const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateKnowledgeObjects() {
    const mappings = [
        { code: 'EF69LP20', knowledgeObject: 'Reconstrução das condições de produção e circulação e adequação do texto à construção composicional e ao estilo de gênero (Lei, código, estatuto, código, regimento etc.)' },
        { code: 'EF69LP21', knowledgeObject: 'Apreciação e réplica' },
        { code: 'EF69LP22', knowledgeObject: 'Textualização, revisão e edição' },
        { code: 'EF69LP23', knowledgeObject: 'Textualização, revisão e edição' }
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
