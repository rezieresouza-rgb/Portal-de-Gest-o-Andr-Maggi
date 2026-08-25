const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixResequence() {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envText.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  const supabaseUrl = urlMatch[1].trim();
  const supabaseKey = keyMatch[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching all official ofícios from civic_documents...");
  const { data: civicData, error } = await supabase.from('civic_documents').select('*').eq('template', 'official_oficio');

  if (error || !civicData) {
    console.error("Error fetching oficios:", error);
    return;
  }

  // Sort by created date / id timestamp
  const sorted = [...civicData].sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp || 0).getTime();
    const timeB = new Date(b.date || b.timestamp || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || '').localeCompare(b.id || '');
  });

  console.log(`Found ${sorted.length} oficios to resequence...`);

  let currentNum = 23;

  for (const doc of sorted) {
    const formattedNum = `${String(currentNum).padStart(3, '0')}/2026/EECAAMCOL/SEDUC/MT`;
    const updatedContent = {
      ...(doc.content || {}),
      number: currentNum,
      formatted_number: formattedNum
    };

    console.log(`Updating ID ${doc.id}: ${doc.content?.recipient_name} (${doc.content?.module_source}) -> ${formattedNum}`);

    const { error: updateErr } = await supabase
      .from('civic_documents')
      .update({
        student_name: formattedNum,
        content: updatedContent
      })
      .eq('id', doc.id);

    if (updateErr) {
      console.error(`Error updating ${doc.id}:`, updateErr);
    } else {
      currentNum++;
    }
  }

  console.log("\nResequencing COMPLETE! Next ofício will be number:", currentNum);
}

fixResequence();
