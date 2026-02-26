const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
    const loginToFind = '07794468108';

    const { data: user, error: fetchErr } = await supabase.from('users').select('*').eq('login', loginToFind).single();

    const newPassword = `TestPass!${Math.floor(Math.random() * 1000)}`;

    const updates = {
        name: user.name,
        login: user.login,
        password_hash: newPassword
    };

    console.log("SENDING UPDATES:", updates);
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select();

    if (error) {
        console.error("Failed to update:", error);
    } else {
        console.log("Update returned array length:", data.length);
        if (data.length > 0) {
            console.log("Updated row:", data[0]);
        } else {
            console.log("WARNING: UPDATE AFFECTED 0 ROWS. THIS EXPLAINS THE ISSUE!");
        }
    }
}

testProfileUpdate();
