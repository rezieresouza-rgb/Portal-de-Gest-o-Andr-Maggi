import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import xlsx from 'xlsx';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log("Lendo arquivo Excel...");
        const filePath = 'C:\\\\Users\\\\rezie\\\\OneDrive\\\\Área de Trabalho\\\\arquivos sistema\\\\HABILIDADES 6º ANO.xlsx';
        const workbook = xlsx.readFile(filePath);
        
        const worksheet = workbook.Sheets['DADOS'];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Encontradas ${data.length} habilidades.`);
        
        // Ensure table exists (create if not) - we will create table assessment_descriptors
        // Schema: id (uuid), grade_level (string), subject (string), descriptor (string), performance (string), created_at
        const { error: createErr } = await supabase.rpc('create_assessment_descriptors_table_if_not_exists');
        // Actually, if we don't have RPC, we can just create it via SQL or add it as a JSON column to existing assessments.
        // Let's create it via a direct raw query if possible, or since we can't easily, we'll insert it into a JSON column in an existing generic table or create a migration.
        
        // Wait, does Supabase MCP have execute_sql? Yes!
    } catch (e) {
        console.error("Erro:", e);
    }
}

run();
