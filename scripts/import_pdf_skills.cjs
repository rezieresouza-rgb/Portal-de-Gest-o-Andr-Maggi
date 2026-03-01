const fs = require('fs');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseAndInsert() {
    const filePath = "C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\HABILIDADES BNCC\\EF69LP01 AO EF69LP56.pdf";

    if (!fs.existsSync(filePath)) {
        console.error("File not found at: ", filePath);
        return;
    }

    console.log("Reading PDF...");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Regex to match (EF69LPxx) text...
    const regex = /\((EF\d{2}[A-Z]{2}\d{2})\)([\s\S]*?)(?=(?:\(EF\d{2}[A-Z]{2}\d{2}\)|$))/g;

    let match;
    const skillsToInsert = [];

    while ((match = regex.exec(text)) !== null) {
        const code = match[1].trim(); // e.g EF69LP01 
        let description = match[2].trim();

        // Clean up newlines to form a single continuous paragraph
        description = description.replace(/\s+/g, ' ');

        const subject = "LÍNGUA PORTUGUESA"; // 'LP'
        const year_range = "EF69"; // derived from 'EF69'

        skillsToInsert.push({
            code: code,
            description: description,
            subject: subject,
            year_range: year_range
        });
    }

    console.log(`Extracted ${skillsToInsert.length} skills. First 2:`);
    console.log(skillsToInsert.slice(0, 2));

    if (skillsToInsert.length === 0) {
        console.log("No skills matched the pattern.");
        return;
    }

    console.log("Inserting into Supabase 'bncc_skills'...");
    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log(`Successfully inserted/updated ${result ? result.length : 'unknown'} skills!`);
    }
}

parseAndInsert();
