import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log("Testing upload to 'school-attachments'...");
  
  const testContent = "This is a test file contents.";
  const { data, error } = await supabase.storage
    .from('school-attachments')
    .upload('test_connection.txt', testContent, {
        upsert: true
    });

  if (error) {
    console.error("Upload Failed:", error);
  } else {
    console.log("SUCCESS! Upload worked. Path:", data.path);
    
    // Clean up
    await supabase.storage.from('school-attachments').remove(['test_connection.txt']);
    console.log("Cleaned up test file.");
  }
}

testUpload();
