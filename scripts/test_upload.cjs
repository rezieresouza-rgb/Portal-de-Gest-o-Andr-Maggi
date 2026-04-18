const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpload() {
    console.log("Attempting test upload to 'library_covers'...");
    
    // Create a dummy file
    const content = "test content";
    const blob = Buffer.from(content, 'utf-8');
    const fileName = `test_${Date.now()}.txt`;
    const filePath = `covers/${fileName}`;

    const { data, error } = await supabase.storage
        .from('library_covers')
        .upload(filePath, blob, {
            contentType: 'text/plain',
            upsert: false
        });

    if (error) {
        console.error("❌ Upload Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Upload Successful!", data);
        
        // Try to get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('library_covers')
            .getPublicUrl(filePath);
        console.log("🔗 Public URL:", publicUrl);
    }
}

testUpload();
