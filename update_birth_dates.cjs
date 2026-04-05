const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const studentsBirthData = [
  {"code": "2663366", "birth": "2015-02-12"},
  {"code": "2663372", "birth": "2014-02-20"},
  {"code": "2666069", "birth": "2014-05-27"},
  {"code": "2663227", "birth": "2014-05-27"},
  {"code": "2667373", "birth": "2014-08-03"},
  {"code": "2663331", "birth": "2014-04-30"},
  {"code": "2663302", "birth": "2015-09-02"},
  {"code": "2333256", "birth": "2014-08-05"},
  {"code": "2302934", "birth": "2014-07-03"},
  {"code": "2235438", "birth": "2015-02-05"},
  {"code": "2663319", "birth": "2014-10-09"},
  {"code": "2304139", "birth": "2014-09-23"},
  {"code": "2663337", "birth": "2014-12-19"},
  {"code": "2667419", "birth": "2015-01-01"},
  {"code": "2232207", "birth": "2014-04-18"},
  {"code": "2226454", "birth": "2014-06-18"},
  {"code": "2667474", "birth": "2014-10-28"},
  {"code": "2667315", "birth": "2014-02-13"},
  {"code": "2667352", "birth": "2014-10-02"},
  {"code": "2667754", "birth": "2014-04-06"},
  {"code": "2667259", "birth": "2014-04-06"},
  {"code": "2325664", "birth": "2014-10-02"},
  {"code": "2670313", "birth": "2015-01-05"},
  {"code": "2237215", "birth": "2014-08-02"},
  {"code": "2663303", "birth": "2014-06-27"},
  {"code": "2667838", "birth": "2013-01-09"},
  {"code": "2667230", "birth": "2014-12-21"},
  {"code": "2337289", "birth": "2014-05-03"},
  {"code": "2347759", "birth": "2014-08-25"},
  {"code": "2725402", "birth": "2013-08-20"}
];

async function updateBirthDates() {
  console.log("Starting birth date update for 30 students...");

  for (const s of studentsBirthData) {
    console.log(`Updating ${s.code} with birth date ${s.birth}...`);
    const { error } = await supabase
      .from('students')
      .update({ birth_date: s.birth })
      .eq('registration_number', s.code);
    
    if (error) {
      console.error(`Error updating student ${s.code}:`, error);
    }
  }

  console.log("Update complete!");
}

updateBirthDates();
