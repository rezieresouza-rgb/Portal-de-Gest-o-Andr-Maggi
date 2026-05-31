const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const newTasks = [
  // Praça/Quadra de Basquete
  {
    block: 'Pátio',
    area_name: 'Praça/Quadra de Basquete',
    task_description: 'Varrer extensão, recolher folhas/galhos/lixo, esvaziar lixeiras externas.',
    frequency: 'DIARIA',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Praça/Quadra de Basquete',
    task_description: 'Retirar mato de calçadas/cantos, lavar áreas de circulação/bebedouros externos.',
    frequency: 'SEMANAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Praça/Quadra de Basquete',
    task_description: 'Poda de grama, jardinagem, limpeza de ralos/grelhas pluviais.',
    frequency: 'MENSAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Praça/Quadra de Basquete',
    task_description: 'Limpeza pesada de pisos externos, quadras e pintura de guias (se necessário).',
    frequency: 'TRIMESTRAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },

  // Corredor Central
  {
    block: 'Pátio',
    area_name: 'Corredor Central',
    task_description: 'Varrer extensão, recolher folhas/galhos/lixo, esvaziar lixeiras externas.',
    frequency: 'DIARIA',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Corredor Central',
    task_description: 'Retirar mato de calçadas/cantos, lavar áreas de circulação/bebedouros externos.',
    frequency: 'SEMANAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Corredor Central',
    task_description: 'Poda de grama, jardinagem, limpeza de ralos/grelhas pluviais.',
    frequency: 'MENSAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  },
  {
    block: 'Pátio',
    area_name: 'Corredor Central',
    task_description: 'Limpeza pesada de pisos externos, quadras e pintura de guias (se necessário).',
    frequency: 'TRIMESTRAL',
    assigned_employee_name: 'RENATO LUIZ KLEIN'
  }
];

async function run() {
  console.log('Inserting new tasks under Pátio...');
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .insert(newTasks)
    .select();

  if (error) {
    console.error('Error inserting tasks:', error);
  } else {
    console.log('Successfully inserted tasks count:', data ? data.length : 0);
    console.log(data);
  }
}

run();
