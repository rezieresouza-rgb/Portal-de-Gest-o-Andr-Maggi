const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetContract01() {
    console.log('Iniciando limpeza e reset de saldos exclusivamente para os contratos contendo 01/2026...');

    try {
        // Obter os IDs do(s) contrato(s)
        const { data: contracts, error: errC } = await supabase
            .from('contracts')
            .select('id, number, supplier_id')
            .ilike('number', '%01%2026%');

        if (errC || !contracts || contracts.length === 0) {
            console.error('Nenhum contrato 01/2026 encontrado:', errC);
            return;
        }

        console.log(`Encontrados ${contracts.length} contratos correspondentes a 01/2026. Processando...`);

        for (const contract of contracts) {
            const contractId = contract.id;
            console.log(`\nContrato ID: ${contractId} | Número: ${contract.number}`);

            // 1. Limpar order_items
            const { data: orders, error: errOrders } = await supabase
                .from('orders')
                .select('id')
                .eq('contract_id', contractId);

            if (errOrders) console.error('  Erro ao obter orders:', errOrders);

            if (orders && orders.length > 0) {
                const orderIds = orders.map(o => o.id);
                console.log(`  Apagando itens de ${orderIds.length} guias de recebimento...`);
                const processBatchDelete = async (ids) => {
                    const batchSize = 100;
                    for (let i = 0; i < ids.length; i += batchSize) {
                        const batch = ids.slice(i, i + batchSize);
                        await supabase.from('order_items').delete().in('order_id', batch);
                    }
                };
                await processBatchDelete(orderIds);
            } else {
                console.log('  Nenhuma guia de recebimento encontrada para limpar itens.');
            }

            // 2. Limpar orders
            console.log(`  Apagando guias de recebimento (orders)...`);
            const { error: errO } = await supabase.from('orders').delete().eq('contract_id', contractId);
            if (errO) console.error('  Erro ao limpar orders:', errO);

            // 3. Limpar contract_events
            console.log('  Apagando eventos (contract_events) do contrato...');
            const { error: errE } = await supabase.from('contract_events').delete().eq('contract_id', contractId);
            if (errE) console.error('  Erro ao limpar contract_events:', errE);

            // 4. Resetar acquired_quantity
            console.log('  Resetando quantidade adquirida dos itens vinculados ao contrato...');
            const { error: errCi } = await supabase
                .from('contract_items')
                .update({ acquired_quantity: 0 })
                .eq('contract_id', contractId);

            if (errCi) console.error('  Erro ao resetar contract_items:', errCi);
        }

        console.log('\nReset do(s) contrato(s) concluído com sucesso!');
    } catch (err) {
        console.error('Erro fatal:', err);
    }
}

resetContract01();
