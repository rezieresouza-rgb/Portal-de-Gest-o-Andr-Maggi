const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Data extracted from the previous script and print
const students = [
  { reg: "2668996", gender: "FEMININO" },
  { reg: "2668972", gender: "MASCULINO" },
  { reg: "2669069", gender: "FEMININO" },
  { reg: "2669227", gender: "FEMININO" },
  { reg: "2667873", gender: "MASCULINO" },
  { reg: "2668931", gender: "FEMININO" },
  { reg: "2668902", gender: "MASCULINO" },
  { reg: "2723256", gender: "MASCULINO" },
  { reg: "2302994", gender: "MASCULINO" },
  { reg: "2286436", gender: "MASCULINO" },
  { reg: "2668889", gender: "FEMININO" },
  { reg: "2304199", gender: "FEMININO" },
  { reg: "2668897", gender: "MASCULINO" },
  { reg: "2667419", gender: "MASCULINO" },
  { reg: "2292207", gender: "MASCULINO" },
  { reg: "2286454", gender: "MASCULINO" },
  { reg: "2667474", gender: "MASCULINO" },
  { reg: "2667915", gender: "MASCULINO" },
  { reg: "2667952", gender: "FEMININO" }
];

async function fixGender() {
  console.log("Starting gender fix for 6th Grade A...");

  for (const s of students) {
    const { data, error } = await supabase
      .from('students')
      .update({ gender: s.gender })
      .eq('registration_number', s.reg)
      .select('name');

    if (error) {
      console.error(`Error fixing ${s.reg}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Corrected gender for: ${data[0].name} -> ${s.gender}`);
    } else {
      console.warn(`Student with registration ${s.reg} not found.`);
    }
  }

  console.log("Gender fix finished.");
}

fixGender();
