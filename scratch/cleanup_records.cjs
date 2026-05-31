require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanupHolidays() {
    const nonSchoolDays = [
        '2026-01-01' // Feriado Nacional
    ];

    console.log("Cleaning up records on non-school days in January...");

    let totalDeleted = 0;

    for (const dateStr of nonSchoolDays) {
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = nextDay.toISOString().split('T')[0];

        const { data, error, count } = await supabase
            .from('maintenance_records')
            .delete({ count: 'exact' })
            .gte('completed_at', `${dateStr}T00:00:00Z`)
            .lt('completed_at', `${nextDateStr}T00:00:00Z`);

        if (error) {
            console.error(`Error deleting for ${dateStr}:`, error);
        } else {
            console.log(`Deleted ${count} records for ${dateStr}.`);
            totalDeleted += count || 0;
        }
    }

    console.log(`Cleanup complete! Total deleted: ${totalDeleted}`);
}

cleanupHolidays().catch(console.error);
