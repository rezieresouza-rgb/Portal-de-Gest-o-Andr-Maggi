import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Asset, User } from '../types';
import {
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building2,
  ShieldCheck,
  LogIn,
  Wrench,
  X,
  RefreshCw,
  FileText,
  Package,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface PublicEnvironmentViewProps {
  location: string;
  user?: User | null;
  onClose?: () => void;
  onOpenLogin?: () => void;
  onNavigateToModule?: () => void;
}

export const PublicEnvironmentView: React.FC<PublicEnvironmentViewProps> = ({
  location,
  user,
  onClose,
  onOpenLogin,
  onNavigateToModule
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('TODOS');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Modal de Manutenção / Chamado público
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    reporterName: '',
    description: '',
    priority: 'MÉDIA' as 'BAIXA' | 'MÉDIA' | 'ALTA',
    category: 'PATRIMÔNIO / MOBILIÁRIO'
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchEnvironmentAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('location', location)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      if (assetsData) {
        setAssets(
          assetsData.map(a => ({
            id: a.id,
            description: a.description,
            location: a.location,
            heritageNumber: a.heritage_number,
            condition: a.condition as any,
            isUnserviceable: a.is_unserviceable,
            photo: a.photo,
            unserviceableData: a.unserviceable_data,
            acquisitionDocument: a.acquisition_document,
            acquisitionYear: a.acquisition_year,
            history: [],
            timestamp: new Date(a.created_at).getTime()
          }))
        );
      }
    } catch (err: any) {
      console.error('Erro ao carregar bens do ambiente:', err);
      setError('Não foi possível carregar os dados atualizados do ambiente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentAssets();

    // Inscrever em atualizações em tempo real para este ambiente
    const subscription = supabase
      .channel(`public_assets_${location}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets', filter: `location=eq.${location}` },
        () => fetchEnvironmentAssets()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [location]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch =
        asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.heritageNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCondition =
        conditionFilter === 'TODOS'
          ? true
          : conditionFilter === 'INSERVÍVEL'
          ? asset.isUnserviceable || asset.condition === 'PÉSSIMO'
          : asset.condition === conditionFilter && !asset.isUnserviceable;

      return matchesSearch && matchesCondition;
    });
  }, [assets, searchTerm, conditionFilter]);

  const stats = useMemo(() => {
    const total = assets.length;
    const excelentes = assets.filter(a => a.condition === 'EXCELENTE' && !a.isUnserviceable).length;
    const bons = assets.filter(a => a.condition === 'BOM' && !a.isUnserviceable).length;
    const regulares = assets.filter(a => a.condition === 'REGULAR' && !a.isUnserviceable).length;
    const inserviveis = assets.filter(a => a.isUnserviceable || a.condition === 'PÉSSIMO').length;
    const operacionais = total - inserviveis;

    return { total, excelentes, bons, regulares, inserviveis, operacionais };
  }, [assets]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSendMaintenanceReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.description.trim()) return;

    setIsSubmittingReport(true);
    try {
      // Salva na tabela cleaning_occurrences ou maintenance_tasks
      const { error } = await supabase.from('cleaning_occurrences').insert([
        {
          location: location,
          description: `[QR Code Publico - ${maintenanceForm.category}] ${maintenanceForm.description.toUpperCase()}`,
          reported_by: maintenanceForm.reporterName.trim().toUpperCase() || 'VISITANTE / QR CODE',
          status: 'PENDENTE',
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setReportSuccess(true);
      setTimeout(() => {
        setIsMaintenanceModalOpen(false);
        setReportSuccess(false);
        setMaintenanceForm({
          reporterName: '',
          description: '',
          priority: 'MÉDIA',
          category: 'PATRIMÔNIO / MOBILIÁRIO'
        });
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar chamado de manutenção:', err);
      alert('Não foi possível registrar a ocorrência no momento. Tente novamente.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getConditionBadgeStyle = (condition: string, isUnserviceable?: boolean) => {
    if (isUnserviceable || condition === 'PÉSSIMO') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    switch (condition) {
      case 'EXCELENTE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'BOM':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'REGULAR':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Estilos específicos para Impressão em PDF A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* CABEÇALHO TELA PÚBLICA (NÃO IMPRESSO) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-escola-oficial.png"
              alt="Escola Logo"
              className="h-10 w-auto object-contain hidden sm:block"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  Consulta Pública
                </span>
                <span className="text-slate-400 text-xs font-semibold hidden md:inline">
                  Portal de Gestão EEAM
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                EE Cívico-Militar André Antônio Maggi
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrintPDF}
              className="px-3 sm:px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              title="Gerar relatório em PDF"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Baixar / Imprimir PDF</span>
            </button>

            {user ? (
              <button
                onClick={onNavigateToModule}
                className="px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
              >
                <Building2 size={15} />
                <span className="hidden sm:inline">Painel do Sistema</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Fazer Login</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
                title="Fechar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO PDF */}
      <div className="print-only p-6 border-b-2 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img src="/brasao_mt.png" alt="MT" className="h-14 w-auto" />
            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900 tracking-wider">
                ESTADO DE MATO GROSSO • SECRETARIA DE ESTADO DE EDUCAÇÃO
              </h2>
              <h1 className="text-base font-black uppercase text-blue-900">
                ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Lucas do Rio Verde - MT • Código Inep: 51084220
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="border border-slate-300 p-2 rounded text-center min-w-[120px]">
              <p className="text-[9px] font-bold text-slate-500 uppercase">TIPO DE DOCUMENTO</p>
              <p className="text-xs font-black text-slate-900 uppercase">INVENTÁRIO FÍSICO</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 p-3 rounded border border-slate-300 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">AMBIENTE / SALA:</span>
            <span className="text-base font-black text-slate-900 ml-2 uppercase">{location}</span>
          </div>
          <div className="text-xs text-slate-600 font-semibold">
            Data de Emissão: <strong className="text-slate-900">{currentDateFormatted}</strong>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (TELA & IMPRESSÃO) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* CARDS DE APRESENTAÇÃO E RESUMO DO AMBIENTE (TELA) */}
        <div className="no-print bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest">
                <MapPin size={16} />
                <span>Inventário Patrimonial por Ambiente</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight">
                {location}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
                Relação oficial de bens móveis cadastrados e vistoriados neste espaço físico.
                Qualquer pessoa pode consultar este inventário ou comunicar necessidades de manutenção.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Wrench size={16} />
                <span>Reportar Problema neste Ambiente</span>
              </button>

              <button
                onClick={fetchEnvironmentAssets}
                disabled={loading}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
                title="Atualizar Dados"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>

          {/* ESTATÍSTICAS DO AMBIENTE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Total de Bens
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                Em Bom Estado
              </p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {stats.operacionais}
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                Regular / Atenção
              </p>
              <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                {stats.regulares}
              </p>
            </div>

            <div className="p-4 bg-red-50/60 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                Inservíveis / Reparo
              </p>
              <p className="text-2xl sm:text-3xl font-black text-red-700 mt-1">
                {stats.inserviveis}
              </p>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTRO E PESQUISA (TELA) */}
        <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Pesquisar por Patrimônio ou Descrição..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* FILTROS DE ESTADO */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['TODOS', 'EXCELENTE', 'BOM', 'REGULAR', 'INSERVÍVEL'].map(cond => (
              <button
                key={cond}
                onClick={() => setConditionFilter(cond)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  conditionFilter === cond
                    ? cond === 'INSERVÍVEL'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Carregando inventário do ambiente...
            </p>
          </div>
        )}

        {/* MENSAGEM DE ERRO */}
        {error && !loading && (
          <div className="bg-red-50 p-6 rounded-3xl border border-red-200 flex items-center gap-4 text-red-700">
            <AlertTriangle size={24} className="shrink-0 text-red-600" />
            <div>
              <h4 className="text-sm font-bold uppercase">Falha de Conexão</h4>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* NENHUM ITEM ENCONTRADO */}
        {!loading && !error && filteredAssets.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <Package size={48} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800 uppercase">
              Nenhum bem patrimonial cadastrado ou encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não há itens correspondentes aos filtros selecionados para o ambiente {location}.
            </p>
          </div>
        )}

        {/* VISUALIZAÇÃO EM TELA (CARDS E TABELA RESPONSIVA) */}
        {!loading && !error && filteredAssets.length > 0 && (
          <>
            {/* Tabela para impressão / PDF */}
            <div className="print-only mt-4">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border border-slate-400">
                    <th className="p-2 border border-slate-400 font-bold uppercase w-12 text-center">Nº</th>
                    <th className="p-2 border border-slate-400 font-bold uppercase w-32">PATRIMÔNIO</th>
                    <th className="p-2 border border-slate-400 font-bold uppercase">DESCRIÇÃO DO BEM</th>
                    <th className="p-2 border border-slate-400 font-bold uppercase w-28 text-center">ESTADO</th>
                    <th className="p-2 border border-slate-400 font-bold uppercase w-28 text-center">ANO/DOC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, index) => (
                    <tr key={asset.id} className="border border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-bold">{index + 1}</td>
                      <td className="p-2 border border-slate-300 font-black text-slate-900">
                        {asset.heritageNumber}
                      </td>
                      <td className="p-2 border border-slate-300 font-medium uppercase">
                        {asset.description}
                        {asset.isUnserviceable && (
                          <span className="block text-[9px] text-red-600 font-bold mt-0.5">
                            LAUDO DE INSERVÍVEL: {asset.unserviceableData?.reason || 'Sem motivo detalhado'}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold uppercase">
                        {asset.isUnserviceable ? 'INSERVÍVEL' : asset.condition}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-slate-600 font-medium">
                        {asset.acquisitionYear || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* RODAPÉ DE ASSINATURA PARA IMPRESSÃO DE PDF */}
              <div className="mt-12 pt-8 border-t border-slate-400 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 w-4/5 mx-auto pt-1 font-bold uppercase">
                    Comissão de Inventário Patrimonial
                  </div>
                  <p className="text-[10px] text-slate-500">Servidor Responsável pela Vistoria</p>
                </div>
                <div>
                  <div className="border-t border-slate-800 w-4/5 mx-auto pt-1 font-bold uppercase">
                    Direção / Gestão Escolar
                  </div>
                  <p className="text-[10px] text-slate-500">EEAM Lucas do Rio Verde</p>
                </div>
              </div>
            </div>

            {/* CARDS VISUAIS PARA CELULAR / NAVEGADOR (NÃO IMPRESSO) */}
            <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredAssets.map(asset => {
                const isBad = asset.isUnserviceable || asset.condition === 'PÉSSIMO';
                return (
                  <div
                    key={asset.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* HEADER DO CARD */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm">
                          PAT: {asset.heritageNumber}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${getConditionBadgeStyle(
                            asset.condition,
                            asset.isUnserviceable
                          )}`}
                        >
                          {isBad ? 'INSERVÍVEL' : asset.condition}
                        </span>
                      </div>

                      {/* FOTO SE HOUVER */}
                      {asset.photo ? (
                        <div
                          onClick={() => setViewingPhoto(asset.photo!)}
                          className="w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-slate-100 relative group/photo cursor-pointer"
                        >
                          <img
                            src={asset.photo}
                            alt={asset.description}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <ImageIcon size={16} /> Ver Ampliado
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-slate-50 rounded-2xl mb-4 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                          <Package size={28} />
                        </div>
                      )}

                      {/* DESCRIÇÃO */}
                      <h3 className="font-extrabold text-slate-900 uppercase text-sm sm:text-base leading-snug tracking-tight mb-2">
                        {asset.description}
                      </h3>

                      {/* DETALHES DE INSERVÍVEL / MOTIVO */}
                      {asset.isUnserviceable && asset.unserviceableData?.reason && (
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 my-2 text-xs text-red-700 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-red-800">
                            <AlertTriangle size={12} /> Motivo do Laudo
                          </div>
                          <p className="font-medium text-[11px] leading-tight">
                            {asset.unserviceableData.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RODAPÉ DO CARD */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-blue-500" />
                        {location}
                      </span>
                      {asset.acquisitionYear && (
                        <span>Ano: {asset.acquisitionYear}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* RODAPÉ TELA PÚBLICA (NÃO IMPRESSO) */}
      <footer className="no-print bg-white border-t border-slate-200/80 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EEAM - Portal de Gestão Escolar Integrada</p>
          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <span>Lucas do Rio Verde - MT</span>
            <span>•</span>
            <span>Módulo de Patrimônio & Zeladoria</span>
          </div>
        </div>
      </footer>

      {/* MODAL DE AMPLIAÇÃO DE FOTO */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="no-print fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white p-3 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
          >
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-5 right-5 z-10 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <img
              src={viewingPhoto}
              alt="Foto do Bem"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* MODAL DE CHAMADO DE MANUTENÇÃO / OCORRÊNCIA */}
      {isMaintenanceModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Wrench size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Comunicar Ocorrência
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  Ambiente: <span className="text-amber-600 font-bold">{location}</span>
                </p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                <h4 className="text-sm font-black text-emerald-800 uppercase">
                  Ocorrência Registrada com Sucesso!
                </h4>
                <p className="text-xs text-emerald-700">
                  A equipe de zeladoria e gestão patrimonial foi notificada.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMaintenanceReport} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Seu Nome ou Identificação (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prof. João / Aluno / Visitante"
                    value={maintenanceForm.reporterName}
                    onChange={e =>
                      setMaintenanceForm({ ...maintenanceForm, reporterName: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Categoria da Ocorrência
                  </label>
                  <select
                    value={maintenanceForm.category}
                    onChange={e =>
                      setMaintenanceForm({ ...maintenanceForm, category: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="PATRIMÔNIO / MOBILIÁRIO">Mobiliário Danificado (Cadeira, Mesa, Quadro)</option>
                    <option value="ILUMINAÇÃO / ELÉTRICA">Elétrica / Lâmpada Queimada / Tomada</option>
                    <option value="AR CONDICIONADO">Ar Condicionado / Ventilação</option>
                    <option value="LIMPEZA / HIGIENIZAÇÃO">Limpeza / Higienização Necessária</option>
                    <option value="OUTRO">Outros Reparos Prediais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Descrição do Problema *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descreva o item com defeito ou necessidade de manutenção..."
                    value={maintenanceForm.description}
                    onChange={e =>
                      setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingReport ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Wrench size={16} /> Enviar Ocorrência
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(false)}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicEnvironmentView;
