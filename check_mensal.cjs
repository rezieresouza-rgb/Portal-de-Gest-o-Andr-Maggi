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
        
        const { data: records, error: recError } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('task_id', mensalIds)
            .gte('completed_at', '2026-05-01T00:00:00.000Z')
            .lte('completed_at', '2026-05-31T23:59:59.000Z');
            
        if (recError) throw recError;
        
        const datesCount = {};
        records.forEach(r => {
            const date = new Date(r.completed_at).toISOString().split('T')[0];
            datesCount[date] = (datesCount[date] || 0) + 1;
        });
        
        console.log('MENSAL records in May:', datesCount);
        
        // Find if there is another date besides 2026-05-28
        // If there is, we can delete the one on 2026-05-28 or the other one.
        // The user says "percebi que o mensal saiu com duas datas" -> they probably want only 28/05, or only the original one?
        // Wait, if they asked me to "coloca o mensal dia 28/05/2026", and now it has two, they probably want to remove the OTHER date, or they want me to just update the existing one to 28/05/2026 instead of adding a new one.
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
