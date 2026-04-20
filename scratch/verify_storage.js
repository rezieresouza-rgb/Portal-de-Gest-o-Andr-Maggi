import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorage() {
  console.log("Verifying storage bucket: school-attachments");
  
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error("Error listing buckets:", bucketError);
    return;
  }

  const bucket = buckets.find(b => b.name === 'school-attachments');
  if (bucket) {
    console.log("SUCCESS: Bucket 'school-attachments' found.");
    console.log("Bucket details:", bucket);
  } else {
    console.error("FAILED: Bucket 'school-attachments' NOT found in the list.");
  }
}

verifyStorage();
