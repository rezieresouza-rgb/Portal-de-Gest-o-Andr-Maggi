const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBuckets() {
    console.log("Checking storage buckets...");
    
    const buckets = ['library_covers', 'finance-documents', 'covers', 'images', 'public'];
    
    for (const bucket of buckets) {
        console.log(`Checking bucket: ${bucket}`);
        const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
        
        if (error) {
            console.log(`❌ Error in ${bucket}: ${error.message} (Status: ${error.status})`);
        } else {
            console.log(`✅ Bucket ${bucket} accessible (returned ${data.length} items)`);
        }
    }
}

checkBuckets();
