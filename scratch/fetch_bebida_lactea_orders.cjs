const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase config missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== Searching Contract 010/2026/SEDUC/MT ===");
  
  // 1. Fetch contract
  const { data: contracts, error: cErr } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(*)')
    .ilike('number', '%010/2026%');

  if (cErr) {
    console.error("Error fetching contracts:", cErr);
  } else {
    console.log("Contract found:", contracts.map(c => ({ id: c.id, number: c.number, supplier: c.supplier?.name })));
    if (contracts && contracts.length > 0) {
      console.log("Contract items:", contracts[0].items.map(i => ({ id: i.id, description: i.description, contracted: i.contracted_quantity, acquired: i.acquired_quantity, unitPrice: i.unit_price })));
    }
  }

  console.log("\n=== Searching Orders with BEBIDA LÁCTEA ===");
  // 2. Fetch order items matching BEBIDA LÁCTEA or BEBIDA LACTEA
  const { data: orderItems, error: oiErr } = await supabase
    .from('order_items')
    .select('*, order:orders(*)')
    .or('description.ilike.%bebida%lactea%,description.ilike.%bebida%láctea%');

  if (oiErr) {
    console.error("Error fetching order_items:", oiErr);
  } else {
    console.log(`Found ${orderItems?.length || 0} order items with BEBIDA LÁCTEA:`);
    orderItems?.forEach(item => {
      console.log(`- Order #${item.order?.order_number || item.order_id} | Date: ${item.order?.date || item.created_at} | Qty: ${item.quantity} ${item.unit} | Unit Price: R$ ${item.unit_price} | Total: R$ ${item.total} | Status: ${item.order?.status}`);
    });
  }

  // 3. Fetch all orders for contract 010/2026
  if (contracts && contracts.length > 0) {
    const contractId = contracts[0].id;
    console.log(`\n=== All Orders linked to Contract ID ${contractId} ===`);
    const { data: contractOrders, error: coErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('contract_id', contractId);

    if (coErr) {
      console.error("Error fetching contract orders:", coErr);
    } else {
      console.log(`Found ${contractOrders?.length || 0} orders for contract 010/2026:`);
      contractOrders?.forEach(o => {
        console.log(`Order #${o.order_number} (${o.date}) - Status: ${o.status}`);
        o.order_items?.forEach(i => {
          console.log(`   -> ${i.description}: ${i.quantity} ${i.unit} @ R$ ${i.unit_price} = R$ ${i.total}`);
        });
      });
    }
  }

  // 4. Also check contract events / deliveries / payment guides
  console.log("\n=== Checking Contract Events / Deliveries for 010/2026 ===");
  if (contracts && contracts.length > 0) {
    const { data: events } = await supabase
      .from('contract_events')
      .select('*')
      .eq('contract_id', contracts[0].id);
    console.log("Events:", events);
  }
}

run();
