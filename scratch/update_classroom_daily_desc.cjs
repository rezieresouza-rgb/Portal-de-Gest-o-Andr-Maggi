const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const targetClassrooms = [
  "Sala 7", "Sala 8", "Sala 09", "Sala 10", "Sala 11",
  "Sala 16", "Sala 17", "Sala 19", "Sala 20", "Sala 21",
  "Sala 22", "Sala 23", "Sala 24", "Sala de Recursos Multifuncionais"
];

// String has exactly 249 characters (which is <= 255 limit)
const newDescription = "Remover pó/pano úmido em mesas (superfícies/portas-livros), cadeiras (assentos/encostos), armários, estantes, peitoris, caixilhos e lousas; Limpar telas de TVs; Varrer e passar pano úmido no piso (exceto madeira); Esvaziar e manter limpos os cestos.";

async function run() {
  console.log('Updating daily task descriptions for classrooms (length: ' + newDescription.length + ')...');
  let totalUpdated = 0;

  for (const room of targetClassrooms) {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({ task_description: newDescription })
      .eq('frequency', 'DIARIA')
      .eq('area_name', room)
      .select();

    if (error) {
      console.error(`Error updating ${room}:`, error);
    } else {
      console.log(`Updated ${room}:`, data ? data.length : 0);
      totalUpdated += data ? data.length : 0;
    }
  }

  console.log(`\nUpdates completed. Total classrooms updated: ${totalUpdated}`);
}

run();
