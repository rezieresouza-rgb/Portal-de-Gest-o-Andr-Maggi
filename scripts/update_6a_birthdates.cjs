const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const studentsToUpdate = [
  { registration: "2668996", name: "ANA CLARA PEREIRA BRITO", birth: "2015-02-12", gender: "F" },
  { registration: "2668972", name: "BEPIET PANARA METUKTIRE", birth: "2014-02-28", gender: "M" },
  { registration: "2669069", name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA", birth: "2014-05-27", gender: "F" },
  { registration: "2669227", name: "CRISLANE EDUARDA FARIAS DE ALMEIDA", birth: "2014-05-27", gender: "F" },
  { registration: "2667873", name: "DAVI LUCAS LIMA RODRIGUES", birth: "2014-05-08", gender: "M" },
  { registration: "2668931", name: "EMILY CRISTINA DO NASCIMENTO", birth: "2014-04-30", gender: "F" },
  { registration: "2668902", name: "ENZO ARTHUR DA SILVA SANTOS", birth: "2015-03-02", gender: "M" },
  { registration: "2723256", name: "FELIPE NUNES DA SILVA", birth: "2014-06-05", gender: "M" },
  { registration: "2302994", name: "GUILHERME SOUZA ALVES", birth: "2014-07-03", gender: "M" },
  { registration: "2286436", name: "GUSTAVO HENRIQUE DE PAULA DE LARA", birth: "2015-03-05", gender: "M" },
  { registration: "2668889", name: "ISADORA CAETANO MATEUS", birth: "2014-10-09", gender: "F" },
  { registration: "2304199", name: "JASMIM RAFAELA AMÂNCIO DE LIMA", birth: "2015-03-23", gender: "F" },
  { registration: "2668897", name: "JOÃO GABRIEL DE OLIVEIRA MARTINS", birth: "2014-12-19", gender: "M" },
  { registration: "2667419", name: "JOÃO LUCAS DE SOUZA DA SILVA", birth: "2015-01-01", gender: "M" },
  { registration: "2292207", name: "JOÃO OTÁVIO GONSALVES DE LIMA", birth: "2014-04-18", gender: "M" },
  { registration: "2286454", name: "JOÃO VITOR PEREIRA DA SILVA", birth: "2014-06-18", gender: "M" },
  { registration: "2667474", name: "KAUAN FEITOSA MORAES", birth: "2014-10-28", gender: "M" },
  { registration: "2667915", name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", birth: "2014-02-13", gender: "M" },
  { registration: "2667952", name: "MARIA FERNANDA EQUIDONE MACHADO", birth: "2014-10-08", gender: "F" }
];

async function runUpdate() {
  console.log(`Starting update for ${studentsToUpdate.length} students...`);

  for (const s of studentsToUpdate) {
    const { data, error } = await supabase
      .from('students')
      .update({
        birth_date: s.birth,
        gender: s.gender
      })
      .eq('registration_number', s.registration)
      .select('id, name');

    if (error) {
      console.error(`Error updating ${s.name} (${s.registration}):`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Successfully updated: ${data[0].name} (${s.registration})`);
    } else {
      console.warn(`Student not found: ${s.name} (${s.registration})`);
    }
  }

  console.log('Update process finished.');
}

runUpdate();
