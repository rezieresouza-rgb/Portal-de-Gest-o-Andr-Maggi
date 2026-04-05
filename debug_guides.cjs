const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock process.env since we're in cjs and might not have dotenv
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuides() {
  const { data, error } = await supabase.from('consumption_statements').select('*').limit(1);
  if (error) return console.error(error);
  console.log("Consumption Columns:", Object.keys(data[0] || {}));
}

checkGuides();
