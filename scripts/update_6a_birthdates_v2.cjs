const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const corrections = [
  { oldReg: "2668331", newReg: "2668931", name: "EMILY CRISTINA DO NASCIMENTO", birth: "2014-04-30", gender: "F" },
  { oldReg: "2668302", newReg: "2668902", name: "ENZO ARTHUR DA SILVA SANTOS", birth: "2015-03-02", gender: "M" },
  { oldReg: "2286438", newReg: "2286436", name: "GUSTAVO HENRIQUE DE PAULA DE LARA", birth: "2015-03-05", gender: "M" },
  { reg: "2668889", name: "ISADORA CAETANO MATEUS", birth: "2014-10-09", gender: "F" } // Corrigir nome de MATTOS para MATEUS
];

async function runCorrections() {
  console.log("Running follow-up corrections...");

  for (const c of corrections) {
    let query;
    if (c.oldReg) {
      query = supabase.from('students').update({
        registration_number: c.newReg,
        birth_date: c.birth,
        gender: c.gender
      }).eq('registration_number', c.oldReg);
    } else {
      query = supabase.from('students').update({
        name: c.name,
        birth_date: c.birth,
        gender: c.gender
      }).eq('registration_number', c.reg);
    }

    const { data, error } = await query.select('id, name');

    if (error) {
      console.error(`Error updating ${c.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Successfully updated/corrected: ${data[0].name} (${c.newReg || c.reg})`);
    } else {
      console.warn(`Record not found for correction: ${c.name}`);
    }
  }

  console.log("Follow-up corrections finished.");
}

runCorrections();
