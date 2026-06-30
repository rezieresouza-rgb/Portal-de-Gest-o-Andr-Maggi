import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Connecting to:", supabaseUrl);
  
  const mockSnapshot = {
    id: `inv-test-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    turno: 'Test Turno',
    responsavel: 'Test Responsavel',
    items: JSON.stringify([{ id: 'test-item', name: 'Test Food', unit: 'Kg', previousBalance: 10, entries: 5, outputs: 2 }]),
    timestamp: Date.now()
  };

  const { data, error } = await supabase.from('merenda_inventory_history').insert([mockSnapshot]).select();
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success! Inserted:", data);
  }
}
run();
