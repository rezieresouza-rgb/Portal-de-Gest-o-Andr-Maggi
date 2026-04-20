require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Starting retroactive skill synchronization...");

  // 1. Fetch all plans
  const { data: plans, error } = await supabase
    .from('lesson_plans')
    .select('id, content_json');

  if (error) {
    console.error("Error fetching plans:", error);
    return;
  }

  console.log(`Analyzing ${plans.length} plans...`);

  let updatedCount = 0;

  for (const plan of plans) {
    const content = plan.content_json || {};
    const rows = content.rows || [];
    const currentSkills = content.skills || [];
    const currentRecomp = content.recompositionSkills || [];
    
    // Extract codes from all rows
    const allText = rows.map(r => r.skillsText || '').join(' ');
    const codes = allText.match(/[A-Z0-9-]{6,15}/g) || [];
    const uniqueCodes = [...new Set(codes.map(c => c.trim()))];

    const currentCodesSet = new Set([...currentSkills, ...currentRecomp].map(s => s.code));
    const missingCodes = uniqueCodes.filter(c => !currentCodesSet.has(c));

    if (missingCodes.length > 0) {
      console.log(`Plan ${plan.id} is missing codes: ${missingCodes.join(', ')}`);
      
      // Fetch skill details
      const { data: skillsData, error: skillsError } = await supabase
        .from('bncc_skills')
        .select('code, description')
        .in('code', missingCodes);
      
      if (!skillsError && skillsData && skillsData.length > 0) {
        const newSkills = [...currentSkills];
        const newRecomp = [...currentRecomp];

        skillsData.forEach(s => {
          const isRecomp = s.code.includes('EF01') || s.code.includes('EF02') || s.code.includes('EF03') || s.code.includes('EF04') || s.code.includes('EF05');
          if (isRecomp) newRecomp.push({ code: s.code, description: s.description });
          else newSkills.push({ code: s.code, description: s.description });
        });

        // Update plan
        const updatedContent = {
          ...content,
          skills: newSkills,
          recompositionSkills: newRecomp
        };

        const { error: updateError } = await supabase
          .from('lesson_plans')
          .update({ content_json: updatedContent })
          .eq('id', plan.id);
        
        if (!updateError) {
          updatedCount++;
          console.log(`Plan ${plan.id} updated successfully.`);
        } else {
          console.error(`Error updating plan ${plan.id}:`, updateError);
        }
      }
    }
  }

  console.log(`Finished! Updated ${updatedCount} plans.`);
}

main();
