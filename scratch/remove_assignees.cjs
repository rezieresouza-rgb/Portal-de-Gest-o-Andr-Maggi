require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function removeAssignees() {
    console.log("Fetching records from Jan to Apr...");
    const startDate = '2026-01-01T00:00:00Z';
    const endDate = '2026-04-30T23:59:59Z';

    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
        const { data: pageData, error: pageError } = await supabase
            .from('maintenance_records')
            .select('*')
            .gte('completed_at', startDate)
            .lte('completed_at', endDate)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
        if (pageError) throw pageError;
        
        if (pageData && pageData.length > 0) {
            allRecords = [...allRecords, ...pageData];
        }
        
        if (!pageData || pageData.length < pageSize) {
            break;
        }
        page++;
    }

    console.log(`Found ${allRecords.length} records.`);

    const updates = allRecords.map(record => {
        let newName = record.performed_by_name;
        if (newName) {
            if (newName.includes('[MATUTINO]')) {
                newName = 'Manutenção [MATUTINO]';
            } else if (newName.includes('[VESPERTINO]')) {
                newName = 'Manutenção [VESPERTINO]';
            } else {
                newName = 'Manutenção';
            }
        } else {
            newName = 'Manutenção';
        }
        
        return {
            ...record,
            performed_by_name: newName
        };
    });

    console.log("Updating records...");
    const batchSize = 500;
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(updates.length / batchSize)}...`);
        
        const { error: updateError } = await supabase
            .from('maintenance_records')
            .upsert(batch);
            
        if (updateError) {
            console.error("Error updating batch:", updateError);
            return;
        }
    }
    
    console.log("Done.");
}

removeAssignees();
