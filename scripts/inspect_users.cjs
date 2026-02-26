const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccount() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, login, email, cpf, password_hash, status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
    } else {
        console.log("Recent Users:\n", JSON.stringify(data, null, 2));
    }
}
checkAccount();
