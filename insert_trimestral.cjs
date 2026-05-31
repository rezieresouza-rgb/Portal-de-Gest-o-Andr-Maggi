const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Fetching TRIMESTRAL tasks...');
        const { data: tasks, error: fetchError } = await supabase
            .from('maintenance_tasks')
            .select('*')
            .eq('frequency', 'TRIMESTRAL');

        if (fetchError) throw fetchError;
        
        console.log(`Found ${tasks.length} TRIMESTRAL tasks.`);
        
        const recordsToInsert = tasks.map(task => ({
            task_id: task.id,
            status: 'CONCLUIDO',
            completed_at: '2026-05-28T12:00:00.000Z',
            performed_by_name: `${task.assigned_employee_name || 'Manutenção'} [MATUTINO]`
        }));

        console.log('Inserting records for 28/05/2026...');
        const { data: inserted, error: insertError } = await supabase
            .from('maintenance_records')
            .insert(recordsToInsert)
            .select();

        if (insertError) throw insertError;
        
        console.log(`Successfully inserted ${inserted.length} records.`);
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
