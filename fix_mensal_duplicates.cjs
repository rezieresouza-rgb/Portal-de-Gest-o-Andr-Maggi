const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Fetching MENSAL tasks...');
        const { data: mensalTasks, error: fetchMError } = await supabase
            .from('maintenance_tasks')
            .select('id')
            .eq('frequency', 'MENSAL');

        if (fetchMError) throw fetchMError;
        
        const mensalIds = mensalTasks.map(t => t.id);
        
        const { data: recordsToDelete, error: recError } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('task_id', mensalIds)
            .gte('completed_at', '2026-05-29T00:00:00.000Z')
            .lte('completed_at', '2026-05-31T23:59:59.000Z');
            
        if (recError) throw recError;
        
        if (recordsToDelete.length > 0) {
            const idsToDelete = recordsToDelete.map(r => r.id);
            const { error: delError } = await supabase
                .from('maintenance_records')
                .delete()
                .in('id', idsToDelete);
            if (delError) throw delError;
            console.log(`Deleted ${idsToDelete.length} extra MENSAL records in May (from 29/05 onwards).`);
        } else {
            console.log('No extra records found to delete.');
        }

        const { data: recordsToDelete2, error: recError2 } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('task_id', mensalIds)
            .gte('completed_at', '2026-05-01T00:00:00.000Z')
            .lte('completed_at', '2026-05-27T23:59:59.000Z');
            
        if (recError2) throw recError2;
        
        if (recordsToDelete2.length > 0) {
            const idsToDelete2 = recordsToDelete2.map(r => r.id);
            const { error: delError2 } = await supabase
                .from('maintenance_records')
                .delete()
                .in('id', idsToDelete2);
            if (delError2) throw delError2;
            console.log(`Deleted ${idsToDelete2.length} extra MENSAL records in May (before 28/05).`);
        } else {
            console.log('No extra records found before 28/05.');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
