
import React, { useState } from 'react';
import { Sparkles, Send, BrainCircuit, Lightbulb, FileSearch, RefreshCw } from 'lucide-react';
import { suggestMenu } from '../geminiService';

const AIConsultant: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSuggestMenu = async () => {
    setLoading(true);
    try {
      // Mocking inventory data for the suggestion
      const inventoryData = [
        { name: 'Arroz', current: 1500, min: 2000, expiry: '2024-08-10' },
        { name: 'Feijão', current: 800, min: 500, expiry: '2024-12-15' },
        { name: 'Carne Bovina', current: 400, min: 300, expiry: '2024-06-20' },
      ];
      const result = await suggestMenu(inventoryData);
      setSuggestion(result || 'Não foi possível gerar a sugestão agora.');
    } catch (error) {
      console.error(error);
      setSuggestion('Erro ao processar consulta com a IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles size={24} />
            </span>
            <h2 className="text-3xl font-bold">Assistente Estratégico IA</h2>
          </div>
          <p className="text-emerald-50 max-w-xl text-lg opacity-90">
            Analise contratos, preveja desabastecimentos e otimize o cardápio escolar com inteligência artificial generativa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={handleSuggestMenu}
          disabled={loading}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group text-left"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
            <Lightbulb size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Otimizar Cardápio</h3>
          <p className="text-sm text-gray-500 mt-2">Sugestões baseadas no estoque atual e datas de validade.</p>
        </button>

        <button className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group text-left">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <FileSearch size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Auditoria de Contrato</h3>
          <p className="text-sm text-gray-500 mt-2">Verifique cláusulas, prazos e inconsistências de preços.</p>
        </button>

        <button className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group text-left">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <RefreshCw size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Previsão de Compras</h3>
          <p className="text-sm text-gray-500 mt-2">Analise tendências de consumo e antecipe pedidos.</p>
        </button>
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={16} className="text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-900">A IA está processando os dados...</p>
            <p className="text-sm text-gray-500">Isso pode levar alguns segundos dependendo da complexidade.</p>
          </div>
        </div>
      )}

      {suggestion && !loading && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-emerald-50 px-8 py-4 border-b border-emerald-100 flex items-center justify-between">
            <span className="text-emerald-700 font-bold flex items-center gap-2">
              <Sparkles size={18} /> Resposta da Consultoria
            </span>
            <button onClick={() => setSuggestion(null)} className="text-emerald-400 hover:text-emerald-600 text-sm">Limpar</button>
          </div>
          <div className="p-8 prose prose-emerald max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {suggestion}
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
            <button className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
              Aplicar Sugestões
            </button>
            <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">
              Salvar como PDF
            </button>
          </div>
        </div>
      )}

      {!suggestion && !loading && (
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Faça uma pergunta livre para a IA (ex: 'Quais itens do contrato 2024-001 estão acima do preço de mercado?')"
            className="w-full px-6 py-5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl shadow-sm text-lg outline-none transition-all pr-16"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AIConsultant;
