import React from 'react';
import { 
  ShieldCheck, 
  Info, 
  AlertTriangle, 
  Printer, 
  CheckCircle2, 
  Hammer,
  Eye,
  Clock,
  MapPin,
  AlertCircle,
  ClipboardList,
  Zap,
  BookOpen
} from 'lucide-react';

const CleaningOfficialManual: React.FC = () => {
  const protocolData = [
    {
      ambiente: "1. Salas de Aula",
      diaria: "Remover pó em mesas, cadeiras, quadro de vidro e TV; Varrer o piso; Manter cestos limpos; Inspeções: vidros, lâmpadas, fechaduras, mobiliário",
      semanal: "Eliminar marcas de lápis, caneta, adesivos e gomas; Remover mesas/cadeiras para limpeza completa do piso; Aplicar produto para conservação de pisos; Higienizar cestos",
      mensal: "Remover manchas do piso; Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "2. Auditório",
      diaria: "Remover pó em mesas, cadeiras e equipamentos de áudio/vídeo; Varrer o piso; Manter cestos limpos; Inspeções: vidros, lâmpadas, fechaduras, mobiliário",
      semanal: "Eliminar marcas em mobiliário e paredes; Remover cadeiras para limpeza completa do piso; Higienizar cestos",
      mensal: "Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "3. Sala de Recursos",
      diaria: "Remover pó em mesas, armários, estantes, equipamentos pedagógicos e bancadas; Varrer o piso; Manter cestos limpos; Inspeções diárias",
      semanal: "Eliminar marcas em mobiliário; Remover mobiliário para limpeza completa do piso; Higienizar cestos",
      mensal: "Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "4. Laboratórios (Maker, Ciências, EF, APA)",
      diaria: "Remover pó em bancadas, banquetas, mesas, racks, armários, microscópios, computadores, TVs e demais equipamentos; Varrer o piso; Manter cestos limpos; Inspeções: vidros, lâmpadas, fechaduras, mobiliário, partes metálicas pontiagudas",
      semanal: "Eliminar marcas em mobiliário; Remover mobiliário para limpeza completa do piso; Higienizar cestos",
      mensal: "Remover manchas do piso; Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado; Limpar equipamentos eletroeletrônicos com produto específico",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "5. Biblioteca",
      diaria: "Remover pó em mesas, cadeiras, estantes de livros, balcões, computadores e TVs; Varrer o piso; Manter cestos limpos; Inspeções diárias",
      semanal: "Eliminar marcas em mobiliário; Remover mobiliário para limpeza completa do piso; Higienizar cestos",
      mensal: "Remover manchas do piso; Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "6. Administrativos",
      diaria: "Remover pó em mesas, cadeiras, armários, estantes, balcões, computadores, impressoras, telefones e TVs; Varrer o piso; Manter cestos limpos; Inspeções diárias",
      semanal: "Eliminar marcas em mobiliário; Remover mobiliário para limpeza completa do piso; Higienizar cestos",
      mensal: "Remover manchas do piso; Limpar paredes e rodapés; Limpar janelas; Limpar filtros do ar condicionado",
      trimestral: "Eliminar objetos aderidos à laje/forro; Lavar cortinas"
    },
    {
      ambiente: "7. Sanitários",
      diaria: "Lavar e desinfetar vasos sanitários, mictórios e pias; Higienizar torneiras, maçanetas e dispensadores; Repor papel higiênico, papel toalha e sabonete líquido; Varrer o piso com desinfetante; Manter lixeiras limpas; Inspeções: verificar vazamentos, entupimentos e funcionamento das descargas",
      semanal: "Limpeza profunda de azulejos e rejuntes; Higienizar portas e divisórias; Lavar lixeiras",
      mensal: "Desincrustar pisos e paredes; Limpar ralos e sifões; Revisar ventilação/exaustores",
      trimestral: "Revisão geral de encanamentos e acessórios; Limpeza completa de teto e luminárias externas"
    },
    {
      ambiente: "8. Corredores, Rampas e Hall",
      diaria: "Varrer o piso; Remover pó de corrimãos, guarda-corpos e balcões de recepção; Manter cestos limpos; Inspeções: iluminação, corrimãos, portas de acesso e sinalização",
      semanal: "Limpeza detalhada de corrimãos, guarda-corpos e balcões; Higienizar cestos; Remover marcas nas paredes",
      mensal: "Remover manchas do piso; Limpar paredes e rodapés; Limpar janelas e portas de acesso",
      trimestral: "Revisão geral de corrimãos, guarda-corpos e balcões; Limpeza completa de teto e sinalização"
    },
    {
      ambiente: "9. Calçadas (internas)",
      diaria: "Varrer o piso interno; Remover folhas, resíduos e objetos soltos; Lavar com água e detergente neutro; Inspeções: rachaduras, buracos e acúmulo de lixo",
      semanal: "Limpeza detalhada das áreas internas; Remover manchas superficiais; Higienizar lixeiras",
      mensal: "Lavagem completa com jato de água ou lavadora; Remover manchas persistentes; Revisar drenagem",
      trimestral: "Revisão geral de pisos internos; Reparos em rachaduras e nivelamento; Limpeza completa de áreas de difícil acesso"
    },
    {
      ambiente: "10. Calçada Externa",
      diaria: "Varrer toda a extensão externa; Remover folhas, galhos e resíduos; Lavar com água e detergente neutro; Inspeções: rachaduras, buracos, acúmulo de lixo e sinalização externa; Retirar matos das juntas e bordas",
      semanal: "Limpeza detalhada das áreas externas; Remover manchas superficiais; Higienizar lixeiras externas; Controle de matos",
      mensal: "Lavagem completa com jato de água ou lavadora de alta pressão; Remover manchas persistentes; Revisar drenagem externa; Remoção de matos resistentes",
      trimestral: "Revisão geral de pisos externos; Reparos em rachaduras e nivelamento; Limpeza completa de áreas de difícil acesso; Tratamento preventivo contra matos"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Protocolo Operacional de Zeladoria</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manual de Procedimentos André Maggi v2025</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir Ficha de Afixação
          </button>
        </div>
      </div>

      <div id="manual-printable" className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <ClipboardList className="text-orange-600" />
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Tabela de Atividades e Frequências por Setor</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto p-8">
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="p-4 border border-gray-700 uppercase text-[9px] font-black w-48">Ambiente / Setor</th>
                <th className="p-4 border border-gray-700 uppercase text-[9px] font-black">Diária</th>
                <th className="p-4 border border-gray-700 uppercase text-[9px] font-black">Semanal</th>
                <th className="p-4 border border-gray-700 uppercase text-[9px] font-black">Mensal</th>
                <th className="p-4 border border-gray-700 uppercase text-[9px] font-black">Trimestral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {protocolData.map((item, idx) => (
                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="p-4 border border-gray-200 font-black text-[10px] uppercase text-gray-900 leading-tight">
                    {item.ambiente}
                  </td>
                  <td className="p-4 border border-gray-200 text-[9px] text-gray-600 font-medium leading-relaxed">
                    {item.diaria}
                  </td>
                  <td className="p-4 border border-gray-200 text-[9px] text-gray-500 italic leading-relaxed">
                    {item.semanal}
                  </td>
                  <td className="p-4 border border-gray-200 text-[9px] text-gray-500 leading-relaxed">
                    {item.mensal}
                  </td>
                  <td className="p-4 border border-gray-200 text-[9px] text-gray-500 leading-relaxed">
                    {item.trimestral}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #manual-printable { border: none !important; }
          table { font-size: 7pt !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default CleaningOfficialManual;