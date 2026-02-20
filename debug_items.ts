
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItems() {
    const { data, error } = await supabase
        .from('almoxarifado_items')
        .select('id, name, category, description')
        .in('category', ['ESTRUTURADO', 'LIVRO_PROJETO']);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(item => {
        console.log(`ID: ${item.id} | Name: ${item.name} | Cat: ${item.category} | Desc: ${item.description}`);
    });
}

checkItems();
