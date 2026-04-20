require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: plans, error } = await supabase.from('lesson_plans').select('id, content_json, users(name)');
  
  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  const idsToDelete = [];
  for (const plan of plans) {
    let shouldDelete = false;
    
    // Check if user is null or user name contains Cristiano
    if (plan.users && plan.users.name && plan.users.name.toLowerCase().includes('cristiano')) {
      shouldDelete = true;
    }
    
    // Check content_json for Cristiano
    if (plan.content_json) {
      const contentString = JSON.stringify(plan.content_json).toLowerCase();
      if (contentString.includes('cristiano')) {
        shouldDelete = true;
      }
    }

    if (shouldDelete) {
      idsToDelete.push(plan.id);
    }
  }

  console.log(`Found ${idsToDelete.length} plans to delete:`, idsToDelete);

  for (const id of idsToDelete) {
    const { error: delErr } = await supabase.from('lesson_plans').delete().eq('id', id);
    if (delErr) {
      console.error(`Failed to delete plan ${id}:`, delErr);
    } else {
      console.log(`Deleted plan ${id}`);
    }
  }
}

main();
