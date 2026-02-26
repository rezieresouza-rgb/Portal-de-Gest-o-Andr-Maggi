const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordUpdate() {
    console.log("Fetching first user...");
    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (fetchError || !users || users.length === 0) {
        console.error("Error fetching user:", fetchError);
        return;
    }

    const user = users[0];
    console.log(`User found: ${user.login} (${user.id}) - Current hash: ${user.password_hash}`);

    console.log("Attempting to update password_hash...");
    const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ password_hash: 'TestPass123!' })
        .eq('id', user.id)
        .select();

    if (updateError) {
        console.error("Update failed:", updateError);
    } else {
        console.log("Update succeeded:", updateData);
    }

    // Revert
    console.log("Reverting password...");
    await supabase
        .from('users')
        .update({ password_hash: user.password_hash })
        .eq('id', user.id);
}

testPasswordUpdate();
