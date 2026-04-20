import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const monthName = 'JANEIRO';
  const dateStr = '2026-01-01';
  const payload = {
    monthName,
    campanha_realizada: 'Teste de salvamento',
    campanha_a_realizar: '',
    observacoes: '',
    photos: [],
    reports: []
  };

  console.log("Attempting to save to calendar_tracking...");
  
  try {
      // 1. Check if exists
      const { data: existing, error: fetchError } = await supabase
        .from('calendar_tracking')
        .select('id')
        .eq('event_type', 'MONTHLY_REPORT')
        .eq('date', dateStr);

      if (fetchError) {
          console.error("Fetch Error:", fetchError);
          return;
      }

      let result;
      if (existing && existing.length > 0) {
        console.log("Updating existing record:", existing[0].id);
        result = await supabase
           .from('calendar_tracking')
           .update({
              description: JSON.stringify(payload)
           })
           .eq('id', existing[0].id);
      } else {
        console.log("Inserting new record...");
        result = await supabase
           .from('calendar_tracking')
           .insert([{
              event_type: 'MONTHLY_REPORT',
              date: dateStr,
              description: JSON.stringify(payload),
              created_by: 'TEST_SCRIPT'
           }]);
      }

      if (result.error) {
          console.error("Save Error:", result.error);
      } else {
          console.log("SUCCESS! Data saved correctly.");
      }
  } catch (e) {
      console.error("Unexpected Exception:", e);
  }
}

testSave();
