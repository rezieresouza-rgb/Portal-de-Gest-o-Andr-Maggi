const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function inspectOficios() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching from school_oficios...");
  const { data: primaryData, error: primaryErr } = await supabase.from('school_oficios').select('*');
  console.log("school_oficios count:", primaryData?.length, primaryErr?.message || 'OK');
  if (primaryData && primaryData.length > 0) {
    console.log("school_oficios sample:", JSON.stringify(primaryData.slice(0, 10), null, 2));
  }

  console.log("\nFetching from civic_documents template='official_oficio'...");
  const { data: civicData, error: civicErr } = await supabase.from('civic_documents').select('*').eq('template', 'official_oficio');
  console.log("civic_documents count:", civicData?.length, civicErr?.message || 'OK');
  if (civicData && civicData.length > 0) {
    console.log("civic_documents sample:", JSON.stringify(civicData.map(d => ({
      id: d.id,
      date: d.date,
      formatted_number: d.content?.formatted_number || d.student_name,
      module_source: d.content?.module_source || d.student_class,
      title: d.content?.title_subject,
      recipient: d.content?.recipient_name
    })), null, 2));
  }
}

inspectOficios();
