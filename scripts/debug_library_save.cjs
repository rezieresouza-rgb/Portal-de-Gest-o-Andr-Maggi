const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
    console.log("Testing saveBook logic...");
    
    const bookData = {
        title: "TEST BOOK",
        author: "TEST AUTHOR",
        category: "Outros",
        location: "Estante TESTE - Prat. 0",
        total_copies: 1,
        available_copies: 1,
        isbn: "000-00-000-0",
        internal_registration: "TEST-001",
        registration_date: new Date().toISOString().split('T')[0],
        book_type: "AVULSO",
        volume_number: "",
        subtitle: "",
        color_tag: "AMARELO"
    };

    const { data, error } = await supabase
        .from('library_books')
        .insert([bookData]);

    if (error) {
        console.error("Error detected:", error);
    } else {
        console.log("Success! Data inserted:", data);
        // Delete the test record immediately
        await supabase.from('library_books').delete().eq('title', 'TEST BOOK').eq('author', 'TEST AUTHOR');
    }
}

testSave();
