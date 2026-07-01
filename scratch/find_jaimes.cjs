const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findJaimes() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, login, role, password_hash, cpf');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const jaimes = users.filter(u => 
        (u.name && u.name.toLowerCase().includes('jaime')) || 
        (u.login && u.login.toLowerCase().includes('jaime'))
    );

    console.log("Jaime users found:", JSON.stringify(jaimes, null, 2));
}

findJaimes();
