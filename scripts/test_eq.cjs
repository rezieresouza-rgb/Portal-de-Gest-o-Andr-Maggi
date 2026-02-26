const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUpdateByLogin() {
    const loginToFind = '07794468108';

    console.log("SENDING UPDATE DIRECTLY WITH EQ LOGIN");
    const { data, error } = await supabase
        .from('users')
        .update({ password_hash: 'TestPass!999' })
        .eq('login', loginToFind)
        .select();

    if (error) {
        console.error("Failed to update:", error);
    } else {
        console.log("Array length:", data.length);
    }
}

checkUpdateByLogin();
