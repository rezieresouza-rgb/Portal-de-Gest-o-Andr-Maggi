const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function updateExactOficios() {
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

  console.log(`Found ${civicData.length} oficios in DB:`);
  civicData.forEach(d => {
    console.log(`ID: ${d.id} | Recipient: "${d.content?.recipient_name}" | Current Num: "${d.content?.formatted_number}"`);
  });

  // Map of recipient name substring -> target number
  const targetMap = [
    { recipientSub: 'ADRIANO MARCOS', num: 23 },
    { recipientSub: 'ADRIANA APARECIDA', num: 24 },
    { recipientSub: 'RAIANE APARECIDA', num: 25 },
    { recipientSub: 'HELEM CAREM', num: 26 },
    { recipientSub: 'GABRIEL ALVES', num: 27 }
  ];

  for (const item of targetMap) {
    const doc = civicData.find(d => 
      (d.content?.recipient_name || '').toUpperCase().includes(item.recipientSub)
    );

    if (doc) {
      const formattedNum = `${String(item.num).padStart(3, '0')}/2026/EECAAMCOL/SEDUC/MT`;
      const updatedContent = {
        ...(doc.content || {}),
        number: item.num,
        formatted_number: formattedNum
      };

      console.log(`Updating ${item.recipientSub} -> ${formattedNum}...`);
      const { error: updateErr } = await supabase
        .from('civic_documents')
        .update({
          student_name: formattedNum,
          content: updatedContent
        })
        .eq('id', doc.id);

      if (updateErr) {
        console.error(`Failed to update ${doc.id}:`, updateErr);
      } else {
        console.log(`SUCCESS: ${doc.content?.recipient_name} is now ${formattedNum}`);
      }
    } else {
      console.warn(`Could not find document for recipient matching '${item.recipientSub}'`);
    }
  }

  // Check if there are any test documents like 'DFASDFASDF' to remove or resequence
  const testDoc = civicData.find(d => (d.content?.recipient_name || '').toUpperCase().includes('DFASDFASDF'));
  if (testDoc) {
    console.log(`Deleting test document ID ${testDoc.id}...`);
    await supabase.from('civic_documents').delete().eq('id', testDoc.id);
  }

  console.log("\nExact assignment finished!");
}

updateExactOficios();
