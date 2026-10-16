import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  MessageSquare as MessageSquareIcon,
  Printer,
  Download,
  X,
  Camera,
  User,
  Calendar,
  FileText,
  Send,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Mail,
  Phone,
  FileSearch,
  Loader2,
  Building2,
  PackageX,
  Scale,
  Gavel,
  ClipboardList,
  UserCheck,
  FileBadge,
  Eye,
  KeyRound,
  PenTool
} from 'lucide-react';
import { SupplierOccurrence, OccurrenceType, OccurrenceStatus, Contract, Order, ElectronicSignatureProof } from '../types';
import { INITIAL_CONTRACTS, INITIAL_SUPPLIERS } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import ElectronicSignatureModal from './ElectronicSignatureModal';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import { resolveOfficialStaffRole } from '../utils/signatureService';

const DIRECTOR_DATA = {
  name: "REZIERE DE SOUZA",
  cpf: "024.375.561-92",
  schoolName: "CONSELHO DELIBERATIVO DA COMUNIDADE ESCOLAR (CDCE) DA ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI",
  shortSchoolName: "ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI"
};

const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return '---';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const formatDateLongBR = (dateStr?: string) => {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  if (!dateStr) {
    const now = new Date();
    return `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  }
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} de ${months[monthIdx] || parts[1]} de ${year}`;
  }
  return dateStr;
};

const DEFAULT_NC_SANTOS_OCCURRENCE: SupplierOccurrence = {
  id: 'bd26b169-77d1-4970-b023-0837af60bc61',
  supplierId: 'd54ea1d1-4a5f-4432-b935-981c25e5feb3',
  supplierName: 'N.C. SANTOS',
  orderNumber: 'CT 006/2026 - Múltiplos Pedidos (20270171, 20270224 e outros)',
  type: 'NÃO_ENTREGA',
  status: 'PENDENTE',
  description: `Em auditoria e cruzamento de dados entre o Contrato nº 006/2026/SEDUC/MT (Fornecedor: N.C. DOS SANTOS - CNPJ 20.112.223/0001-66) e o Módulo de Pedidos e Compras, constatou-se a inexecução parcial e atraso na entrega dos gêneros alimentícios abaixo discriminados:

1. RESUMO GERAL DO CONTRATO Nº 006/2026/SEDUC/MT:
• Quantidade Total Contratada: 122,000 KG (Valor Total: R$ 8.237,00)
• Quantidade Total Entregue: 22,500 KG (18,44% - R$ 1.608,75)
• Quantidade Total Não Entregue (Saldo Contratual): 99,500 KG (81,56% - R$ 6.628,25)

2. CRUZAMENTO COM O MÓDULO DE PEDIDOS E COMPRAS (PEDIDOS EMITIDOS VS. ENTREGUES):
• MANTEIGA PURA COM SAL (Marca Szura - R$ 71,50/KG):
  - Quantidade Contratada: 86,000 KG
  - Quantidade Pedida (21 pedidos emitidos): 61,000 KG
  - Quantidade Entregue (Guias PAG-2026-4130, 9856, 2677, 9229, 2910, 4406 e 8738): 22,500 KG
  - Quantidade PEDIDA E NÃO ENTREGUE: 38,500 KG (R$ 2.752,75 em aberto)
  - Saldo Contratual ainda não solicitado: 25,000 KG (Total não entregue do contrato: 63,500 KG)

• PEIXE CONGELADO FILÉ DE PINTADO (Marca Delicius Fish - R$ 58,00/KG):
  - Quantidade Contratada: 36,000 KG
  - Quantidade Pedida (2 pedidos emitidos: Pedido nº 20270171 de 09/09/2026 com 12,000 KG e Pedido nº 20270224 de 14/10/2026 com 12,000 KG): 24,000 KG
  - Quantidade Entregue: 0,000 KG
  - Quantidade PEDIDA E NÃO ENTREGUE: 24,000 KG (R$ 1.392,00 em aberto)
  - Saldo Contratual ainda não solicitado: 12,000 KG (Total não entregue do contrato: 36,000 KG)

• TOTAL PEDIDO E NÃO ENTREGUE (PENDENTE DE ENTREGA): 62,500 KG (38,500 KG de Manteiga + 24,000 KG de Peixe), perfazendo o montante de R$ 4.144,75 em ordens de fornecimento pendentes.`,
  itemsAffected: [
    'MANTEIGA PURA COM SAL (38,500 KG PEDIDOS E NÃO ENTREGUES)',
    'PEIXE CONGELADO FILÉ DE PINTADO (24,000 KG PEDIDOS E NÃO ENTREGUES)'
  ],
  issueDate: '2026-10-15',
  orderDate: '2026-09-09',
  deadlineDate: '2026-10-19',
  responsible: 'REZIERE DE SOUZA',
  notificationSent: false
};

interface SupplierNotificationsProps {
  user?: any;
}

const SupplierNotifications: React.FC<SupplierNotificationsProps> = ({ user }) => {
  const [activeView, setActiveView] = useState<'occurrences' | 'suppliers'>('occurrences');
  const [templateMode, setTemplateMode] = useState<'extrajudicial' | 'administrativa' | 'ambos'>('extrajudicial');

  // Carrega ocorrências do Supabase (com fallback inicial preenchido)
  const [occurrences, setOccurrences] = useState<SupplierOccurrence[]>([DEFAULT_NC_SANTOS_OCCURRENCE]);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>(INITIAL_SUPPLIERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [previewOcc, setPreviewOcc] = useState<SupplierOccurrence | null>(null);

  // Estados de Assinatura Eletrônica
  const [signingOcc, setSigningOcc] = useState<SupplierOccurrence | null>(null);
  const [signaturesByOccId, setSignaturesByOccId] = useState<Record<string, ElectronicSignatureProof[]>>(() => {
    try {
      const saved = localStorage.getItem('merenda_notification_signatures_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);

  const fetchSignatures = async () => {
    try {
      const merged: Record<string, ElectronicSignatureProof[]> = {};
      const localMap = JSON.parse(localStorage.getItem('merenda_notification_signatures_v1') || '{}');
      Object.assign(merged, localMap);

      const globalLocal: ElectronicSignatureProof[] = JSON.parse(localStorage.getItem('portal_electronic_signatures_v1') || '[]');
      globalLocal.forEach(sig => {
        if (sig.documentId) {
          if (!merged[sig.documentId]) merged[sig.documentId] = [];
          if (!merged[sig.documentId].some(s => s.verificationCode === sig.verificationCode)) {
            merged[sig.documentId].push(sig);
          }
        }
      });

      const { data, error } = await supabase
        .from('electronic_signatures')
        .select('*')
        .order('signed_at', { ascending: false });

      if (!error && data) {
        data.forEach((r: any) => {
          const proof: ElectronicSignatureProof = {
            id: r.id,
            documentId: r.document_id,
            documentType: r.document_type,
            documentTitle: r.document_title,
            documentHash: r.document_hash,
            signerId: r.signer_id,
            signerName: r.signer_name,
            signerRole: r.signer_role,
            signerCpfOrMatricula: r.signer_cpf_matricula,
            signatureType: r.signature_type,
            verificationCode: r.verification_code,
            signedAt: r.signed_at,
            legalBasis: r.legal_basis,
            touchSignatureDataUrl: r.touch_signature_data,
            notes: r.notes
          };
          if (proof.documentId) {
            if (!merged[proof.documentId]) merged[proof.documentId] = [];
            if (!merged[proof.documentId].some(s => s.verificationCode === proof.verificationCode)) {
              merged[proof.documentId].push(proof);
            }
          }
        });
      }

      setSignaturesByOccId(merged);
    } catch (e) {
      console.warn('Erro ao carregar assinaturas eletrônicas:', e);
    }
  };

  const handleSignatureComplete = (proof: ElectronicSignatureProof) => {
    if (!signingOcc) return;
    setSignaturesByOccId(prev => {
      const current = prev[signingOcc.id] || [];
      const updated = {
        ...prev,
        [signingOcc.id]: [proof, ...current.filter(s => s.verificationCode !== proof.verificationCode)]
      };
      try {
        localStorage.setItem('merenda_notification_signatures_v1', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setSigningOcc(null);
  };

  const fetchOccurrences = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_occurrences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setOccurrences(data.map((d: any) => ({
          id: d.id,
          supplierId: d.supplier_id,
          supplierName: d.supplier_name,
          orderNumber: d.order_number,
          type: d.type,
          status: d.status,
          description: d.description,
          itemsAffected: d.items_affected || [],
          issueDate: d.issue_date,
          orderDate: d.order_date,
          deadlineDate: d.deadline_date,
          photo: d.photo,
          responsible: d.responsible,
          notificationSent: d.notification_sent,
          resolutionDate: d.resolution_date
        })));
      }
    } catch (e) {
      console.error('Erro ao buscar ocorrências:', e);
    }
  };

  const fetchContractsAndOrders = async () => {
    try {
      const { data: sData } = await supabase.from('suppliers').select('*');
      if (sData && sData.length > 0) {
        setDbSuppliers(sData);
      }

      const { data: cData } = await supabase
        .from('contracts')
        .select('*, supplier:suppliers(id, name, full_name, cnpj, email, phone, location), items:contract_items(*)');
      if (cData && cData.length > 0) {
        setContracts(cData.map((c: any) => ({
          id: c.id,
          number: c.number,
          supplierId: c.supplier_id,
          supplierName: c.supplier?.name || 'Desconhecido',
          startDate: c.start_date,
          endDate: c.end_date,
          status: c.status,
          type: c.type,
          items: (c.items || []).map((i: any) => ({
            id: i.id,
            description: i.description,
            contractedQuantity: i.contracted_quantity,
            acquiredQuantity: i.acquired_quantity,
            unit: i.unit,
            unitPrice: i.unit_price,
            brand: i.brand
          }))
        })));
      }

      const { data: oData } = await supabase
        .from('orders')
        .select('*, contract:contracts(number, supplier:suppliers(name)), items:order_items(*)')
        .order('issue_date', { ascending: false });
      if (oData && oData.length > 0) {
        setOrders(oData.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          contractId: o.contract_id,
          contractNumber: o.contract?.number || '---',
          supplierName: o.contract?.supplier?.name || 'Desconhecido',
          issueDate: o.issue_date,
          deliveryDate: o.delivery_date,
          totalValue: o.total_value,
          status: o.status,
          items: o.items || []
        })));
      }
    } catch (e) {
      console.error('Erro ao buscar contratos/pedidos:', e);
    }
  };

  useEffect(() => {
    fetchOccurrences();
    fetchContractsAndOrders();
    fetchSignatures();
    const channel = supabase.channel('supplier_occurrences_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_occurrences' }, fetchOccurrences)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  // Consolida dados de fornecedores a partir dos contratos e cadastro de fornecedores
  const suppliersFromContracts = useMemo(() => {
    const map = new Map();
    contracts.forEach(c => {
      const matchedSup = dbSuppliers.find(
        s => s.id === c.supplierId || s.name?.toUpperCase() === c.supplierName?.toUpperCase()
      ) || INITIAL_SUPPLIERS.find(
        s => s.name?.toUpperCase() === c.supplierName?.toUpperCase()
      );

      if (!map.has(c.supplierId)) {
        map.set(c.supplierId, {
          id: c.supplierId,
          name: c.supplierName,
          fullName: matchedSup?.full_name || c.supplierName,
          category: c.type,
          contractNumbers: [c.number],
          totalItems: c.items.length,
          cnpj: matchedSup?.cnpj || '20.112.223/0001-66',
          email: matchedSup?.email || 'escola.gestao@edu.mt.gov.br',
          phone: matchedSup?.phone || '',
          location: matchedSup?.location || 'COLÍDER/MT'
        });
      } else {
        const existing = map.get(c.supplierId);
        if (!existing.contractNumbers.includes(c.number)) {
          existing.contractNumbers.push(c.number);
          existing.totalItems += c.items.length;
        }
      }
    });
    return Array.from(map.values());
  }, [contracts, dbSuppliers]);

  const getSupplierDetailsForOcc = (occ: SupplierOccurrence) => {
    const found = suppliersFromContracts.find(
      s => s.id === occ.supplierId || s.name?.toUpperCase() === occ.supplierName?.toUpperCase()
    );
    const initialFound = INITIAL_SUPPLIERS.find(
      s => s.name?.toUpperCase() === occ.supplierName?.toUpperCase() || occ.supplierName?.toUpperCase().includes('SANTOS') && s.id === 'sup-nc-santos'
    );
    return {
      razaoSocial: found?.fullName || initialFound?.full_name || occ.supplierName || 'N.C. DOS SANTOS',
      nomeFantasia: found?.name || initialFound?.name || occ.supplierName,
      cnpj: found?.cnpj || initialFound?.cnpj || '20.112.223/0001-66',
      email: found?.email || initialFound?.email || 'nc.laticinios@terra.com.br',
      phone: found?.phone || initialFound?.phone || '66 3541-2211',
      location: found?.location || initialFound?.location || 'COLÍDER/MT',
      contractNumber: found?.contractNumbers?.[0] || '006/2026/SEDUC/MT',
      modality: found?.category || 'Pregão Presencial'
    };
  };

  const [form, setForm] = useState<Omit<SupplierOccurrence, 'id' | 'notificationSent'>>({
    supplierId: '',
    supplierName: '',
    type: 'PRODUTO_ESTRAGADO',
    status: 'PENDENTE',
    description: '',
    itemsAffected: [],
    issueDate: new Date().toLocaleDateString('sv-SE'),
    orderDate: new Date().toLocaleDateString('sv-SE'),
    deadlineDate: new Date().toLocaleDateString('sv-SE'),
    responsible: user?.name || 'Gestor',
    orderNumber: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setForm(prev => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.description) return alert("Preencha os campos obrigatórios.");

    const supplier = suppliersFromContracts.find(s => s.id === form.supplierId);

    try {
      const { error } = await supabase.from('supplier_occurrences').insert([{
        supplier_id: form.supplierId,
        supplier_name: supplier?.name || form.supplierName || "Desconhecido",
        order_number: form.orderNumber,
        type: form.type,
        status: form.status,
        description: form.description,
        items_affected: form.itemsAffected || [],
        issue_date: form.issueDate,
        order_date: form.orderDate,
        deadline_date: form.deadlineDate,
        photo: form.photo,
        responsible: form.responsible,
        notification_sent: false
      }]);

      if (error) throw error;

      await fetchOccurrences();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar no Supabase");
    }
  };

  const resetForm = () => {
    setForm({
      supplierId: '',
      supplierName: '',
      type: 'PRODUTO_ESTRAGADO',
      status: 'PENDENTE',
      description: '',
      itemsAffected: [],
      issueDate: new Date().toLocaleDateString('sv-SE'),
      orderDate: new Date().toLocaleDateString('sv-SE'),
      deadlineDate: new Date().toLocaleDateString('sv-SE'),
      responsible: user?.name || 'Gestor',
      orderNumber: ''
    });
    setImagePreview(null);
  };

  const generateOccurrencePDF = async (occ: SupplierOccurrence) => {
    setIsGeneratingPDF(occ.id);

    setTimeout(async () => {
      const wrapper = document.getElementById(`notif-wrapper-${occ.id}`);
      const element = document.getElementById(`notif-pdf-${occ.id}`);
      if (!element) {
        setIsGeneratingPDF(null);
        return alert("Erro ao localizar template do documento.");
      }

      try {
        if (wrapper) {
          wrapper.classList.remove('hidden');
          wrapper.style.position = 'fixed';
          wrapper.style.left = '-9999px';
          wrapper.style.top = '0';
          wrapper.style.width = '210mm';
        }

        const opt = {
          margin: 10,
          filename: `Notificacao_Merenda_Escolar_${occ.supplierName.replace(/\s+/g, '_')}_${occ.issueDate}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();

        await supabase.from('supplier_occurrences').update({ notification_sent: true }).eq('id', occ.id);
        setOccurrences(prev => prev.map(o => o.id === occ.id ? { ...o, notificationSent: true } : o));
      } catch (e) {
        console.error(e);
      } finally {
        if (wrapper) {
          wrapper.classList.add('hidden');
          wrapper.style.position = '';
          wrapper.style.left = '';
          wrapper.style.top = '';
          wrapper.style.width = '';
        }
        setIsGeneratingPDF(null);
      }
    }, 300);
  };

  const updateStatus = async (id: string, status: OccurrenceStatus) => {
    const resDate = status === 'RESOLVIDO' ? new Date().toLocaleDateString('sv-SE') : null;
    try {
      const updateData: any = { status };
      if (resDate) updateData.resolution_date = resDate;
      const { error } = await supabase.from('supplier_occurrences').update(updateData).eq('id', id);
      if (error) throw error;
      setOccurrences(prev => prev.map(o => o.id === id ? {
        ...o,
        status,
        resolutionDate: resDate || o.resolutionDate
      } : o));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteOccurrence = async (id: string) => {
    if (window.confirm("Deseja excluir este registro de ocorrência?")) {
      try {
        const { error } = await supabase.from('supplier_occurrences').delete().eq('id', id);
        if (error) throw error;
        setOccurrences(prev => prev.filter(o => o.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(o =>
      o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.type.includes(searchTerm.toUpperCase())
    );
  }, [occurrences, searchTerm]);

  const stats = useMemo(() => {
    return {
      pending: occurrences.filter(o => o.status === 'PENDENTE').length,
      resolved: occurrences.filter(o => o.status === 'RESOLVIDO').length,
      critical: occurrences.filter(o => o.type === 'PRODUTO_ESTRAGADO' && o.status === 'PENDENTE').length,
      logistic: occurrences.filter(o => o.type === 'NÃO_ENTREGA' && o.status === 'PENDENTE').length
    };
  }, [occurrences]);

  const renderSignatureSection = (occ: SupplierOccurrence, showShortSchool = false) => {
    const sigs = signaturesByOccId[occ.id] || [];
    const primarySig = sigs[0];

    return (
      <div className="pt-8 text-center space-y-6">
        <p className="font-bold">Colíder/MT, {formatDateLongBR(occ.issueDate)}.</p>

        <div className="max-w-md mx-auto">
          {primarySig?.touchSignatureDataUrl && (
            <div className="flex justify-center mb-1">
              <img
                src={primarySig.touchSignatureDataUrl}
                alt="Assinatura Manuscrita Digital"
                className="h-16 object-contain"
              />
            </div>
          )}
          <div className="pt-4 border-t border-black">
            <p className="font-bold uppercase">{primarySig?.signerName || DIRECTOR_DATA.name}</p>
            <p className="text-xs font-bold uppercase">{resolveOfficialStaffRole(primarySig?.signerName || DIRECTOR_DATA.name, primarySig?.signerRole || 'DIRETOR ESCOLAR')}</p>
            {showShortSchool ? (
              <p className="text-xs">{DIRECTOR_DATA.shortSchoolName}</p>
            ) : (
              <p className="text-xs">CPF/MF: {primarySig?.signerCpfOrMatricula || DIRECTOR_DATA.cpf}</p>
            )}
          </div>
        </div>

        {sigs.length > 0 && (
          <div className="pt-4 space-y-3 text-left font-sans">
            {sigs.map(sig => (
              <ElectronicSignatureStamp key={sig.verificationCode} signature={sig} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderiza fielmente o documento MODELO - NOTIFICAÇÃO MERENDA ESCOLAR - NAO CUMPRIMENTO DE CONTRATO.docx
  const renderOfficialTemplate = (occ: SupplierOccurrence, mode: 'extrajudicial' | 'administrativa' | 'ambos' = templateMode) => {
    const sup = getSupplierDetailsForOcc(occ);
    const year = occ.issueDate ? occ.issueDate.split('-')[0] : String(new Date().getFullYear());
    const notifNum = `006/${year}`;
    const infractionLabel =
      occ.type === 'NÃO_ENTREGA'
        ? 'Atraso na Entrega, Falta de Entrega e Não Atendimento ao Cronograma'
        : occ.type === 'ENTREGA_PARCIAL'
          ? 'Entrega Parcial / Quantitativo Insuficiente'
          : occ.type === 'PRODUTO_ESTRAGADO'
            ? 'Entrega de Produto Estragado / Impróprio para Consumo'
            : 'Fora do Padrão / Especificação do Contrato';

    return (
      <div className="p-10 md:p-14 space-y-8 text-gray-900 font-serif border-[1px] border-gray-200 bg-white min-h-[297mm] leading-relaxed">
        {(mode === 'extrajudicial' || mode === 'ambos') && (
          <div className="space-y-5 text-[13px]">
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-base font-bold uppercase tracking-wide">
                NOTIFICAÇÃO POR IRREGULARIDADES NO FORNECIMENTO
              </h1>
            </div>

            <p className="text-justify">
              <strong>Assunto:</strong> Notificação Extrajudicial Nº {notifNum} C/C Solicitação de Regularização Urgente e Abertura de Processo Administrativo Sancionador - Contrato Nº {sup.contractNumber}
            </p>

            <p className="text-justify">
              Prezada Empresa <strong>{sup.razaoSocial}</strong>, CNPJ nº <strong>{sup.cnpj}</strong>, A/C: Sr.(a) <strong>Representante Legal</strong>, com endereço em <strong>{sup.location} (E-mail: {sup.email} | Tel: {sup.phone})</strong>, pelo presente instrumento, o <strong>{DIRECTOR_DATA.schoolName}</strong>, representada neste ato por <strong>{DIRECTOR_DATA.name}</strong>, PORTADOR DO CPF <strong>{DIRECTOR_DATA.cpf}</strong>, vem apresentar
            </p>

            <div className="text-center py-2">
              <h2 className="text-sm font-bold uppercase underline tracking-wider">
                NOTIFICAÇÃO EXTRAJUDICIAL
              </h2>
            </div>

            <p className="text-justify">
              Em face de Vossa Senhoria, acerca do <strong>NÃO CUMPRIMENTO DAS OBRIGAÇÕES CONTRATUAIS</strong>, conforme detalhado a seguir:
            </p>

            <div className="space-y-3 pl-4 border-l-2 border-gray-400">
              <p className="text-justify">
                <strong>Contrato:</strong> Contrato nº <strong>{sup.contractNumber}</strong>, decorrente do <strong>{sup.modality} SRP nº 001/2026</strong>.
              </p>

              <p className="text-justify">
                <strong>Infração Específica:</strong> Ocorrência de <strong>{infractionLabel}</strong> dos gêneros alimentícios, referente ao pedido nº <strong>{occ.orderNumber || '---'}</strong> formulado em <strong>{formatDateBR(occ.orderDate)}</strong>, com data limite para entrega em <strong>{formatDateBR(occ.deadlineDate)}</strong>.
              </p>

              {occ.itemsAffected && occ.itemsAffected.length > 0 && (
                <div className="space-y-1">
                  <p className="font-bold">Itens em Descumprimento / Pendentes de Entrega:</p>
                  <ul className="list-disc pl-6 space-y-0.5 font-semibold">
                    {occ.itemsAffected.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {occ.description && (
                <div className="p-3.5 bg-gray-50 border border-gray-300 rounded text-[12px] whitespace-pre-line text-justify leading-snug">
                  {occ.description}
                </div>
              )}

              <div className="space-y-1 text-justify">
                <p><strong>Cláusulas Violadas:</strong></p>
                <p>
                  Tal falha configura o descumprimento da <strong>Cláusula Quinta do Contrato</strong>, em especial no que concerne à obrigação de entregar os produtos em no máximo 05 (cinco) dias, devidamente embalados, identificados e acompanhados da Nota Fiscal, conforme o Cronograma de Entrega definido pela Unidade Escolar, além do descumprimento da Cláusula Quinta do Contrato, a conduta viola o <strong>Art. 7º, § 1º da Instrução Normativa nº 009/2024/GS/SEDUC/MT</strong> e as obrigações de fornecimento previstas na <strong>Instrução Normativa nº 011/2024/GS/SEDUC/MT</strong>.
                </p>
              </div>
            </div>

            <p className="text-justify">
              Em virtude do descumprimento contratual supracitado, informamos que a conduta da Contratada está sujeita às sanções previstas na legislação vigente e nas cláusulas contratuais:
            </p>

            <p className="text-justify">
              <strong>Fundamento Legal:</strong> Nos termos da <strong>Lei Federal nº 14.133/2021 (Art. 156 e seguintes)</strong>, do <strong>Decreto Estadual nº 1.525/2022</strong> (que rege as Licitações no âmbito estadual) e da <strong>Cláusula Décima Quinta do Contrato</strong>.
            </p>

            <div className="space-y-1.5">
              <p><strong>Sanções Aplicáveis (Exemplificativas):</strong> O descumprimento contratual sujeita a Contratada às penalidades de:</p>
              <ul className="list-disc pl-8 space-y-1">
                <li>Advertência;</li>
                <li>Multa (Ex: Multa de 2% sobre o valor global do contrato, conforme item 13.6);</li>
                <li>Suspensão Temporária de participar em licitações e impedimento de contratar com a Contratante pelo prazo de até 02 (dois) anos;</li>
                <li>Declaração de Inidoneidade;</li>
                <li>Rescisão Contratual (conforme Cláusula 13.8).</li>
              </ul>
            </div>

            <div className="space-y-2 text-justify">
              <p><strong>A presente Notificação tem dupla finalidade:</strong></p>
              <p>
                <strong>1. Solicitar a Imediata Regularização:</strong> Viemos solicitar a imediata regularização da entrega dos gêneros alimentícios e o estrito cumprimento das obrigações contratuais remanescentes, devendo ocorrer no prazo de: <strong>02 (dois) dias úteis para produtos perecíveis</strong> (carnes, frutas, verduras, etc...) e <strong>05 (cinco) dias úteis para produtos não perecíveis</strong> (estocáveis).
              </p>
              <p>
                <strong>2. Garantir Ampla Defesa:</strong> Em observância ao princípio da Ampla Defesa e do Contraditório, e nos termos do processo administrativo sancionador, fica Vossa Senhoria <strong>NOTIFICADA</strong> para, querendo, apresentar defesa prévia sobre a infração apontada, no prazo de <strong>05 (cinco) dias úteis</strong>, contados do recebimento desta.
              </p>
            </div>

            <p className="text-justify">
              A ausência de regularização e/ou de apresentação de defesa formal no prazo estipulado implicará na abertura do Processo Administrativo de Apuração de Responsabilidade e na aplicação das penalidades cabíveis, conforme a legislação e o Contrato.
            </p>

            <p className="text-justify">
              Ademais, fica a contratada ciente de que, enquanto não houver a regularização do objeto desta notificação, o Fiscal do Contrato fica impedido de realizar o atesto da Nota Fiscal, suspendendo-se o respectivo pagamento (<strong>Art. 3º, XI da IN 009/2024</strong>).
            </p>

            <p className="text-justify">
              Esperamos e contamos com a vossa colaboração para a solução célere do presente impasse.
            </p>

            {renderSignatureSection(occ, false)}
          </div>
        )}

        {mode === 'ambos' && (
          <hr className="my-10 border-t-2 border-dashed border-gray-400" />
        )}

        {(mode === 'administrativa' || mode === 'ambos') && (
          <div className="space-y-5 text-[13px]">
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <p className="text-xs font-bold uppercase text-gray-600">NOTIFICAÇÃO DE DESCUMPRIMENTO CONTRATUAL</p>
              <h2 className="text-base font-bold uppercase">
                NOTIFICAÇÃO ADMINISTRATIVA Nº {notifNum} - {DIRECTOR_DATA.shortSchoolName}
              </h2>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-300 rounded space-y-1 text-xs">
              <p><strong>À Empresa:</strong> {sup.razaoSocial} (CNPJ nº {sup.cnpj})</p>
              <p><strong>A/C:</strong> Representante Legal</p>
              <p><strong>Endereço/E-mail:</strong> {sup.location} | {sup.email} | Tel: {sup.phone}</p>
              <p><strong>Referência:</strong> Contrato nº {sup.contractNumber} / {sup.modality} nº 001/2026</p>
              <p><strong>Assunto:</strong> Notificação por Irregularidade na Entrega de Gêneros Alimentícios (PNAE)</p>
            </div>

            <p>Prezado(a) Senhor(a),</p>

            <p className="text-justify">
              Na qualidade de Fiscal do Contrato / Gestor designado pela Unidade Escolar <strong>{DIRECTOR_DATA.shortSchoolName}</strong>, no uso das atribuições conferidas pelo <strong>Art. 117 da Lei nº 14.133/2021</strong> e pelo <strong>Art. 3º da Instrução Normativa nº 009/2024/GS/SEDUC/MT</strong>, venho por meio desta <strong>NOTIFICAR</strong> formalmente esta empresa acerca da(s) seguinte(s) irregularidade(s) verificada(s) na execução do objeto contratado:
            </p>

            <div className="space-y-2">
              <p><strong>1. DESCRIÇÃO DOS FATOS:</strong></p>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li>
                  Conforme Ordens de Fornecimento nº <strong>{occ.orderNumber || '---'}</strong> (emitidas a partir de {formatDateBR(occ.orderDate)}, com data limite em {formatDateBR(occ.deadlineDate)}), a empresa deveria ter entregue os produtos: <strong>{(occ.itemsAffected || []).join('; ')}</strong>.
                </li>
                <li>
                  <strong>Irregularidade constatada:</strong> {infractionLabel} (Atraso na entrega superior a 5 dias úteis e falta de entrega dos quantitativos solicitados no Módulo de Pedidos e Compras).
                </li>
              </ul>
              {occ.description && (
                <div className="p-3.5 bg-gray-50 border border-gray-300 rounded text-[12px] whitespace-pre-line text-justify leading-snug mt-2">
                  {occ.description}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p><strong>2. FUNDAMENTAÇÃO LEGAL E CONTRATUAL:</strong> Esta conduta infringe as seguintes normas e cláusulas:</p>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li><strong>Prazo de Entrega:</strong> Cláusula Quinta da Minuta do Contrato e Item 7.1.1 do Termo de Referência (entrega em até 5 dias úteis após o pedido);</li>
                <li><strong>Qualidade do Produto:</strong> Itens 7.2.7 e 7.2.8 do TR (produtos não podem apresentar deterioração ou contaminação);</li>
                <li><strong>Dever de Comunicação:</strong> Item 28.38 do TR (obrigação de comunicar eventualidades com 48h de antecedência);</li>
                <li><strong>Infração Administrativa:</strong> Art. 155, incisos I e VII da Lei nº 14.133/2021 (dar causa à inexecução parcial e ensejar o retardamento da execução).</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p><strong>3. DETERMINAÇÃO:</strong> Diante do exposto, determino que esta empresa adote as seguintes providências imediatas:</p>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li><strong>Regularização/Substituição:</strong> Promover a entrega ou substituição dos produtos em desacordo no prazo máximo de <strong>02 (dois) dias úteis</strong> (ou 48 horas, se for Chamada Pública), sob pena de recusa definitiva e bloqueio de pagamentos;</li>
                <li><strong>Defesa Prévia/Justificativa:</strong> Apresentar, no prazo de <strong>02 (dois) dias úteis</strong>, justificativa por escrito acerca das causas do descumprimento, para análise desta fiscalização.</li>
              </ul>
            </div>

            <p className="text-justify">
              <strong>4. ADVERTÊNCIA SOBRE SANÇÕES:</strong> Informamos que a reincidência ou a manutenção da irregularidade ensejará a redução dos fatos a termo e o encaminhamento à autoridade superior para a abertura de Processo Administrativo de Responsabilização, conforme o rito da <strong>Instrução Normativa nº 011/2024/GS/SEDUC/MT</strong> e <strong>IN nº 009/2024/GS/SEDUC/MT</strong>, sujeitando a contratada às sanções de multa (de 0,5% a 30%), impedimento de licitar ou declaração de inidoneidade.
            </p>

            <p>Atenciosamente,</p>

            {renderSignatureSection(occ, true)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* DASHBOARD DE ALERTAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Notificações</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-gray-900">{occurrences.length}</p>
            <FileSearch size={24} className="text-gray-300" />
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atenção Qualidade</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-red-700">{stats.critical}</p>
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Atrasos/Faltas</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-amber-700">{stats.logistic}</p>
            <PackageX size={24} className="text-amber-500" />
          </div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resoluções</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-emerald-700">{stats.resolved}</p>
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* FERRAMENTAS DE GESTÃO E SWITCHER DE VISUALIZAÇÃO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shadow-lg">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Fiscalização de Contratos</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Monitoramento Legal e Qualidade Alimentar PNAE</p>
            </div>
          </div>
          <div className="flex items-center gap-3 no-print">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveView('occurrences')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === 'occurrences' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
              >
                <ClipboardList size={14} /> Histórico de Falhas
              </button>
              <button
                onClick={() => setActiveView('suppliers')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === 'suppliers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
              >
                <Building2 size={14} /> Fornecedores do PNAE
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-50 pt-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder={activeView === 'occurrences' ? "Filtrar histórico por fornecedor ou falha..." : "Pesquisar fornecedor nos contratos..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          {activeView === 'occurrences' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={16} /> Nova Notificação
            </button>
          )}
        </div>
      </div>

      {activeView === 'occurrences' ? (
        /* LISTA DE OCORRÊNCIAS / LAUDOS */
        <div className="grid grid-cols-1 gap-4">
          {filteredOccurrences.length > 0 ? filteredOccurrences.map(occ => {
            const occSignatures = signaturesByOccId[occ.id] || [];
            const isSigned = occSignatures.length > 0;

            return (
              <div key={occ.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group flex flex-col lg:flex-row gap-8 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${occ.type === 'PRODUTO_ESTRAGADO' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>

                <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 shadow-inner group-hover:scale-105 transition-transform">
                  {occ.photo ? (
                    <img src={occ.photo} alt="Evidência" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-200" />
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{occ.supplierName}</h4>
                        <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-2 ${occ.status === 'RESOLVIDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                          }`}>{occ.status}</span>
                        {isSigned && (
                          <span className="px-3 py-1 rounded-xl text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border-2 border-emerald-200 flex items-center gap-1">
                            <ShieldCheck size={12} /> Assinado Digitalmente
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-bold uppercase mt-2">
                        <span className="flex items-center gap-1.5"><AlertCircle size={14} className={occ.type === 'PRODUTO_ESTRAGADO' ? 'text-red-500' : 'text-amber-500'} /> {occ.type.replace('_', ' ')}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Fato: {formatDateBR(occ.issueDate)}</span>
                        {occ.orderNumber && (
                          <span className="flex items-center gap-1.5 text-indigo-600"><FileText size={14} /> {occ.orderNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {occ.status !== 'RESOLVIDO' && (
                        <button onClick={() => updateStatus(occ.id, 'RESOLVIDO')} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm" title="Marcar como Resolvido"><CheckCircle2 size={20} /></button>
                      )}
                      <button onClick={() => deleteOccurrence(occ.id)} className="p-3 bg-gray-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line border-l-4 border-gray-100 pl-4 py-1">{occ.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {occ.itemsAffected.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-500 rounded-lg border border-gray-100 uppercase tracking-widest">{item}</span>
                    ))}
                  </div>

                  {isSigned && (
                    <div className="pt-2 space-y-2">
                      {occSignatures.map(sig => (
                        <ElectronicSignatureStamp key={sig.verificationCode} signature={sig} compact />
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:w-64 flex flex-col justify-center gap-2.5 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8 no-print">
                  <button
                    onClick={() => setPreviewOcc(occ)}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Visualizar Notificação
                  </button>
                  <button
                    onClick={() => setSigningOcc(occ)}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isSigned
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <KeyRound size={16} />
                    {isSigned ? 'Nova Assinatura Digital' : 'Assinar Digitalmente'}
                  </button>
                  <button
                    onClick={() => generateOccurrencePDF(occ)}
                    disabled={isGeneratingPDF === occ.id}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${occ.notificationSent
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    {isGeneratingPDF === occ.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Scale size={16} />
                    )}
                    {occ.notificationSent ? 'Reemitir Notificação PDF' : 'Gerar Notificação Legal'}
                  </button>
                </div>

                {/* TEMPLATE DE NOTIFICAÇÃO EXTRAJUDICIAL */}
                <div id={`notif-wrapper-${occ.id}`} className="hidden">
                  <div id={`notif-pdf-${occ.id}`}>
                    {renderOfficialTemplate(occ, templateMode)}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <PackageX size={64} className="mx-auto mb-4 text-emerald-100" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma irregularidade registrada no período</p>
            </div>
          )}
        </div>
      ) : (
        /* VISUALIZAÇÃO DE DIRETÓRIO DE FORNECEDORES (Puxando dos Contratos) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {suppliersFromContracts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(supplier => {
            const supplierOccurrences = occurrences.filter(o => o.supplierId === supplier.id || o.supplierName === supplier.name);
            const pendingOccurrences = supplierOccurrences.filter(o => o.status === 'PENDENTE');

            return (
              <div key={supplier.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-xl transition-all flex flex-col justify-between group h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-[1.5rem] ${supplier.category.includes('Agricultura') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Building2 size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Contratos Ativos</p>
                      <p className="text-xl font-black text-gray-900">{supplier.contractNumbers.length}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-gray-900 uppercase leading-tight">{supplier.name}</h4>

                  <div className="mt-4 space-y-2">
                    {supplier.contractNumbers.map((cn: string) => (
                      <div key={cn} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 w-fit">
                        <FileBadge size={12} /> CT {cn}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-6 border-t border-gray-50 pt-4">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Itens em Atendimento</p>
                      <p className="text-sm font-black text-gray-700">{supplier.totalItems} Produtos</p>
                    </div>
                    <div className="text-right flex-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Histórico Falhas</p>
                      <p className={`text-sm font-black ${supplierOccurrences.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {supplierOccurrences.length} Registros
                      </p>
                    </div>
                  </div>

                  {pendingOccurrences.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-500 animate-pulse" />
                      <div>
                        <p className="text-[9px] font-black text-red-600 uppercase leading-none">Atenção Crítica</p>
                        <p className="text-[10px] font-bold text-red-700 uppercase mt-1">{pendingOccurrences.length} Notificações Pendentes</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-6">
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name }));
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Notificar Falha
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all">
                    <History size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO / IMPRESSÃO DA NOTIFICAÇÃO */}
      {previewOcc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-5 bg-gray-900 text-white flex flex-wrap justify-between items-center gap-4 no-print">
              <div className="flex items-center gap-3">
                <Scale size={22} className="text-red-400" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Modelo Oficial — Notificação Merenda Escolar (Não Cumprimento de Contrato)</h3>
                  <p className="text-[10px] text-gray-400 uppercase">Fornecedor: {previewOcc.supplierName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setTemplateMode('extrajudicial')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${templateMode === 'extrajudicial' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}
                >
                  1. Notificação Extrajudicial (CDCE)
                </button>
                <button
                  onClick={() => setTemplateMode('administrativa')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${templateMode === 'administrativa' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}
                >
                  2. Notificação Administrativa (Fiscal)
                </button>
                <button
                  onClick={() => setTemplateMode('ambos')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${templateMode === 'ambos' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}
                >
                  Completo (Ambos)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSigningOcc(previewOcc)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <KeyRound size={14} /> Assinar Digitalmente
                </button>
                <button
                  onClick={() => generateOccurrencePDF(previewOcc)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Download size={14} /> Baixar PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  onClick={() => setPreviewOcc(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 custom-scrollbar">
              <div className="max-w-[210mm] mx-auto shadow-xl bg-white">
                {renderOfficialTemplate(previewOcc, templateMode)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {signingOcc && (
        <ElectronicSignatureModal
          isOpen={!!signingOcc}
          onClose={() => setSigningOcc(null)}
          documentId={signingOcc.id}
          documentType="OUTRO"
          documentTitle={`Notificação de Descumprimento Contratual - ${signingOcc.supplierName} (${signingOcc.orderNumber || 'PNAE'})`}
          documentContent={{
            id: signingOcc.id,
            supplierName: signingOcc.supplierName,
            orderNumber: signingOcc.orderNumber,
            type: signingOcc.type,
            issueDate: signingOcc.issueDate,
            itemsAffected: signingOcc.itemsAffected,
            description: signingOcc.description
          }}
          defaultSignerName={user?.name || DIRECTOR_DATA.name}
          defaultSignerRole="DIRETOR ESCOLAR / PRESIDENTE DO CDCE"
          defaultSignerCpf={DIRECTOR_DATA.cpf}
          allowParentMode={true}
          onSignatureComplete={handleSignatureComplete}
        />
      )}

      {/* MODAL DE CADASTRO DE OCORRÊNCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-red-50 flex justify-between items-center border-b border-red-100 shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-600/20">
                  <Gavel size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Processo Administrativo</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Notificação de Inexecução ou Falha Qualitativa</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fornecedor / Contratado</label>
                    <select
                      required
                      value={form.supplierId}
                      onChange={e => {
                        const selected = suppliersFromContracts.find(s => s.id === e.target.value);
                        setForm({ ...form, supplierId: e.target.value, supplierName: selected?.name || '' });
                      }}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="">Selecione o fornecedor...</option>
                      {suppliersFromContracts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Irregularidade</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as any })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="PRODUTO_ESTRAGADO">Produto Estragado/Impróprio (Qualidade)</option>
                      <option value="NÃO_ENTREGA">Não Entrega de Produtos (Logística)</option>
                      <option value="FORA_DO_PADRÃO">Fora do Padrão/Especificação do CT</option>
                      <option value="ENTREGA_PARCIAL">Entrega Parcial/Quantitativo Insuficiente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vincular Ordem de Pedido</label>
                    <select
                      value={form.orderNumber}
                      onChange={e => setForm({ ...form, orderNumber: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="">Opcional: Selecione o pedido...</option>
                      {orders.map(o => <option key={o.id} value={o.orderNumber}>Pedido #{o.orderNumber} ({o.supplierName})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Ocorrência (Fato)</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Pedido (OF)</label>
                    <input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Data Limite p/ Entrega</label>
                    <input type="date" value={form.deadlineDate} onChange={e => setForm({ ...form, deadlineDate: e.target.value })} className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Circunstanciada do Fato</label>
                    <textarea
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Ex: No momento da entrega, verificou-se que o lote de FRANGO apresentava odor forte e coloração amarelada..."
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-medium text-sm h-32 resize-none outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidência Fotográfica do Lote</label>
                    <div
                      onClick={() => document.getElementById('occ-photo')?.click()}
                      className="w-full h-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-red-300 transition-all relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <>
                          <Camera size={32} className="text-gray-300" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Clique para Anexar Foto</p>
                        </>
                      )}
                      <input id="occ-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens afetados (Separe por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: FRANGO, COUVE, BANANA"
                    onChange={e => setForm({ ...form, itemsAffected: e.target.value.split(',').map(s => s.trim().toUpperCase()) })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                  />
                </div>

                <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                  <ShieldAlert size={24} /> Efetivar Registro e Notificar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierNotifications;
