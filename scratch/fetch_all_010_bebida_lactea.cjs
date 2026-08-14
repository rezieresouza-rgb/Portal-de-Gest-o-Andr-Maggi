const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== Contract 010/2026 Items & Payment Guides ===");

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(*)')
    .ilike('number', '%010/2026%');

  console.log("Contract 010/2026 Supplier:", contracts?.[0]?.supplier?.name);
  console.log("Contract Items:");
  contracts?.[0]?.items?.forEach(i => {
    console.log(`- ID: ${i.id} | Desc: ${i.description} | Contracted: ${i.contracted_quantity} ${i.unit} | Acquired: ${i.acquired_quantity} | Price: R$ ${i.unit_price}`);
  });

  const contractId = contracts?.[0]?.id;

  // Check Payment Guides
  const { data: pGuides, error: pgErr } = await supabase
    .from('payment_guides')
    .select('*, items:payment_guide_items(*, item:contract_items(*))')
    .eq('contract_id', contractId);

  if (!pgErr && pGuides) {
    console.log(`\n=== Payment Guides for Contract 010/2026 (${pGuides.length} guides) ===`);
    pGuides.forEach(g => {
      console.log(`\nGuia #${g.guide_number} | Data: ${g.issue_date} | Valor Total: R$ ${g.total_value} | Status: ${g.status}`);
      g.items?.forEach(gi => {
        console.log(`   - Item: ${gi.item?.description || gi.description} | Qty: ${gi.quantity} ${gi.unit || gi.item?.unit} | Price: R$ ${gi.unit_price} | Total: R$ ${gi.total_price}`);
      });
    });
  }

  // Check Order Items in orders table
  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('contract_id', contractId);

  if (orders && orders.length > 0) {
    console.log(`\n=== Orders for Contract 010/2026 (${orders.length} orders) ===`);
    orders.forEach(o => {
      console.log(`\nPedido #${o.order_number} | Data: ${o.date} | Total: R$ ${o.total} | Status: ${o.status}`);
      o.items?.forEach(oi => {
        console.log(`   - Item: ${oi.description} | Qty: ${oi.quantity} ${oi.unit} | Price: R$ ${oi.unit_price} | Total: R$ ${oi.total}`);
      });
    });
  }

  // Also search payment_guide_items across ALL contracts that have 'BEBIDA' or 'LACTEA'
  const { data: allBebidaGuides } = await supabase
    .from('payment_guide_items')
    .select('*, guide:payment_guides(*, contract:contracts(*)), item:contract_items(*)')
    .or('description.ilike.%bebida%,description.ilike.%lactea%,description.ilike.%láctea%');

  console.log(`\n=== All Payment Guide Items across DB with 'bebida' or 'lactea' (${allBebidaGuides?.length || 0}) ===`);
  allBebidaGuides?.forEach(gi => {
    console.log(`Guia #${gi.guide?.guide_number} | Contrato: ${gi.guide?.contract?.number} | Data: ${gi.guide?.issue_date} | Item: ${gi.item?.description || gi.description} | Qty: ${gi.quantity} | Total: R$ ${gi.total_price}`);
  });
}

run();
