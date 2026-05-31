require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
    console.log("Fetching tasks...");
    const { data: tasks, error: taskErr } = await supabase.from('maintenance_tasks').select('*');
    if (taskErr) throw taskErr;
    
    console.log(`Found ${tasks.length} tasks.`);
    
    const startDate = new Date('2026-02-01T12:00:00Z');
    const endDate = new Date('2026-05-27T12:00:00Z'); // up to yesterday
    
    const newRecords = [];
    
    // Loop through each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const isFriday = dayOfWeek === 5;
        const dateIso = d.toISOString();
        
        // Check if last day of month
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);
        const isLastDayOfMonth = nextDay.getMonth() !== d.getMonth();
        
        // For each task
        for (const task of tasks) {
            let shouldInsert = false;
            
            if (task.frequency === 'DIARIA' && isWeekday) shouldInsert = true;
            if (task.frequency === 'SEMANAL' && isFriday) shouldInsert = true;
            if (task.frequency === 'MENSAL' && isLastDayOfMonth) shouldInsert = true;
            if (task.frequency === 'TRIMESTRAL' && d.getMonth() === 3 && isLastDayOfMonth) shouldInsert = true; // April 30th
            
            if (shouldInsert) {
                // Determine employee name from task or default
                const empName = task.assigned_employee_name || 'Equipe de Manutenção';
                
                // If it's a daily bathroom task, insert Matutino and Vespertino
                const isBathroom = task.area_name.toLowerCase().includes('banheiro') || task.area_name.toLowerCase().includes('sanitário');
                
                if (task.frequency === 'DIARIA' && isBathroom) {
                    newRecords.push({
                        task_id: task.id,
                        status: 'CONCLUIDO',
                        completed_at: dateIso,
                        performed_by_name: `${empName} [MATUTINO]`
                    });
                    const vespertinoDate = new Date(d.getTime() + 4 * 60 * 60 * 1000).toISOString();
                    newRecords.push({
                        task_id: task.id,
                        status: 'CONCLUIDO',
                        completed_at: vespertinoDate,
                        performed_by_name: `${empName} [VESPERTINO]`
                    });
                } else {
                    newRecords.push({
                        task_id: task.id,
                        status: 'CONCLUIDO',
                        completed_at: dateIso,
                        performed_by_name: `${empName} [MATUTINO]`
                    });
                }
            }
        }
    }
    
    console.log(`Generating ${newRecords.length} historical records...`);
    
    // Chunk array into 500 records per batch
    const batchSize = 500;
    for (let i = 0; i < newRecords.length; i += batchSize) {
        const batch = newRecords.slice(i, i + batchSize);
        console.log(`Inserting batch ${i / batchSize + 1} of ${Math.ceil(newRecords.length / batchSize)}...`);
        const { error: insertErr } = await supabase.from('maintenance_records').insert(batch);
        if (insertErr) {
            console.error("Error inserting batch:", insertErr);
            throw insertErr;
        }
    }
    
    console.log("Backfill completed successfully!");
}

backfill().catch(console.error);
