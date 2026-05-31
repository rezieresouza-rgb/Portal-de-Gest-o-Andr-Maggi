const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Fetching TRIMESTRAL tasks to delete their records on 28/05/2026...');
        const { data: trimestralTasks, error: fetchErr } = await supabase
            .from('maintenance_tasks')
            .select('id')
            .eq('frequency', 'TRIMESTRAL');
            
        if (fetchErr) throw fetchErr;
        
        const trimestralIds = trimestralTasks.map(t => t.id);
        
        // Delete records for those ids on that date
        const { data: deletedData, error: delError } = await supabase
            .from('maintenance_records')
            .delete()
            .in('task_id', trimestralIds)
            .eq('completed_at', '2026-05-28T12:00:00.000Z')
            .select();
            
        if (delError) throw delError;
        
        console.log(`Deleted ${deletedData ? deletedData.length : 0} TRIMESTRAL records on 28/05.`);

        console.log('Fetching MENSAL tasks...');
        const { data: mensalTasks, error: fetchMError } = await supabase
            .from('maintenance_tasks')
            .select('*')
            .eq('frequency', 'MENSAL');

        if (fetchMError) throw fetchMError;
        
        console.log(`Found ${mensalTasks.length} MENSAL tasks.`);
        
        const recordsToInsert = mensalTasks.map(task => ({
            task_id: task.id,
            status: 'CONCLUIDO',
            completed_at: '2026-05-28T12:00:00.000Z',
            performed_by_name: `${task.assigned_employee_name || 'Manutenção'} [MATUTINO]`
        }));

        console.log('Inserting records for MENSAL on 28/05/2026...');
        const { data: inserted, error: insertError } = await supabase
            .from('maintenance_records')
            .insert(recordsToInsert)
            .select();

        if (insertError) throw insertError;
        
        console.log(`Successfully inserted ${inserted.length} MENSAL records.`);
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
