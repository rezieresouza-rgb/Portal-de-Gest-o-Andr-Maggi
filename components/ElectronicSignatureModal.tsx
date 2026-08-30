import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  X,
  KeyRound,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PenTool,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ElectronicSignatureProof, User as AuthUser } from '../types';
import {
  computeSha256,
  generateVerificationCode,
  authenticateSignatureCredential,
  registerSignatureProof
} from '../utils/signatureService';

interface ElectronicSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: 'TERMO_COMPROMISSO' | 'FICAI' | 'RELATORIO_CIRCUNSTANCIADO' | 'ATA_REUNIAO' | 'ENCAMINHAMENTO_MEDIACAO' | 'OUTRO';
  documentTitle: string;
  documentContent: string | object;
  defaultSignerName?: string;
  defaultSignerRole?: string;
  defaultSignerCpf?: string;
  allowParentMode?: boolean;
  onSignatureComplete: (proof: ElectronicSignatureProof) => void;
}

export const ElectronicSignatureModal: React.FC<ElectronicSignatureModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentType,
  documentTitle,
  documentContent,
  defaultSignerName = '',
  defaultSignerRole = 'DIREÇÃO / COORDENAÇÃO ESCOLAR',
  defaultSignerCpf = '',
  allowParentMode = false,
  onSignatureComplete
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Modo: 'SERVIDOR_SENHA' ou 'PAI_TELA'
  const [signatureMode, setSignatureMode] = useState<'SERVIDOR_SENHA' | 'PAI_TELA'>('SERVIDOR_SENHA');

  // Dados do Signatário
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [signerCpf, setSignerCpf] = useState(defaultSignerCpf);
  const [passwordOrPin, setPasswordOrPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de cálculo
  const [documentHash, setDocumentHash] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Canvas para assinatura na tela (modo pais)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('active_session_v1');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (!defaultSignerName && u.name) setSignerName(u.name);
        if (!defaultSignerRole && u.role) setSignerRole(u.role);
        if (!defaultSignerCpf && (u.cpf || (u as any).registration)) {
          setSignerCpf(u.cpf || (u as any).registration);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [defaultSignerName, defaultSignerRole, defaultSignerCpf]);

  // Calcular Hash SHA-256 e código verificador ao abrir
  useEffect(() => {
    if (isOpen) {
      computeSha256(documentContent).then(hash => setDocumentHash(hash));
      setVerificationCode(generateVerificationCode(documentType));
      setPasswordOrPin('');
      setErrorMessage(null);
      setHasDrawn(false);
    }
  }, [isOpen, documentContent, documentType]);

  // Handlers do Canvas Touch/Mouse
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#064e3b'; // Verde escuro elegante
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleExecuteSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signerName.trim()) {
      setErrorMessage('Informe o nome do signatário.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Você deve aceitar os termos de responsabilidade da assinatura.');
      return;
    }

    setIsProcessing(true);

    try {
      let touchDataUrl: string | undefined = undefined;

      if (signatureMode === 'SERVIDOR_SENHA') {
        // Validação da senha institucional
        const authResult = await authenticateSignatureCredential(currentUser, passwordOrPin);
        if (!authResult.success) {
          setErrorMessage(authResult.message);
          setIsProcessing(false);
          return;
        }
      } else {
        // Modo Pais na Tela
        if (canvasRef.current && hasDrawn) {
          touchDataUrl = canvasRef.current.toDataURL('image/png');
        }
      }

      // Montar comprovante oficial
      const proof: ElectronicSignatureProof = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        documentId: documentId,
        documentType: documentType,
        documentTitle: documentTitle,
        documentHash: documentHash || (await computeSha256(documentContent)),
        signerId: currentUser?.id || 'public-signer',
        signerName: signerName.trim().toUpperCase(),
        signerRole: signerRole.trim().toUpperCase(),
        signerCpfOrMatricula: signerCpf.trim() || 'Cadastrado no Sistema',
        signatureType: signatureMode === 'SERVIDOR_SENHA' ? 'SENHA_INSTITUCIONAL' : 'TELA_TOUCH',
        verificationCode: verificationCode,
        signedAt: new Date().toISOString(),
        legalBasis: 'Lei Federal nº 14.063/2020 e Art. 10, § 2º da MP nº 2.200-2/2001',
        touchSignatureDataUrl: touchDataUrl,
        notes: `Assinatura eletrônica autenticada para ${documentTitle}`
      };

      // Gravar na base de auditoria
      await registerSignatureProof(proof);

      // Notificar componente pai
      onSignatureComplete(proof);
      onClose();
    } catch (err: any) {
      console.error('Erro na assinatura:', err);
      setErrorMessage(err.message || 'Erro inesperado ao emitir assinatura.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-emerald-500/30 animate-in zoom-in-95">
        
        {/* HEADER MODAL */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-emerald-800/40">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[8px] font-black uppercase tracking-wider mb-1">
                <Sparkles size={10} /> Lei Federal nº 14.063/2020
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">
                Assinatura Eletrônica Oficial
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 truncate max-w-md">
                {documentTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* TABS DE SELEÇÃO DE MODO (SE PERMITIDO) */}
        {allowParentMode && (
          <div className="flex p-2 bg-slate-100 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setSignatureMode('SERVIDOR_SENHA')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                signatureMode === 'SERVIDOR_SENHA'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound size={14} /> Servidor / Direção (Por Senha)
            </button>
            <button
              type="button"
              onClick={() => setSignatureMode('PAI_TELA')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                signatureMode === 'PAI_TELA'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PenTool size={14} /> Responsável Legal (Tela Touch / Mouse)
            </button>
          </div>
        )}

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleExecuteSignature} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* PAINEL DE IDENTIFICAÇÃO DO SIGNATÁRIO */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <User size={14} className="text-emerald-600" /> Identificação do Signatário
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Nome do servidor ou responsável"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Cargo / Função / Vínculo
                </label>
                <input
                  type="text"
                  required
                  value={signerRole}
                  onChange={e => setSignerRole(e.target.value)}
                  placeholder="Diretor / Coordenador / Mãe"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Matrícula Institucional ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  value={signerCpf}
                  onChange={e => setSignerCpf(e.target.value)}
                  placeholder="Ex: 298341 / 000.000.000-00"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* MODO 1: AUTENTICAÇÃO POR SENHA INSTITUCIONAL */}
          {signatureMode === 'SERVIDOR_SENHA' ? (
            <div className="space-y-3 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest flex items-center gap-1.5">
                  <KeyRound size={14} className="text-emerald-700" /> Senha Institucional ou PIN de Validação
                </label>
                <span className="text-[9px] font-bold text-emerald-700">Autenticação Segura</span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordOrPin}
                  onChange={e => setPasswordOrPin(e.target.value)}
                  placeholder="Digite sua senha de login ou PIN (ex: 123456)..."
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                A senha confirma sua identidade inequívoca para geração do carimbo eletrônico oficial com validade probatória.
              </p>
            </div>
          ) : (
            /* MODO 2: ASSINATURA NA TELA TOUCH / MOUSE (PAIS) */
            <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <PenTool size={14} className="text-emerald-600" /> Assine no Quadro Abaixo (Touch ou Mouse)
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[9px] font-black text-rose-600 hover:text-rose-700 uppercase flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  <RotateCcw size={10} /> Limpar
                </button>
              </div>

              <div className="bg-white border-2 border-dashed border-emerald-300 rounded-2xl overflow-hidden relative shadow-inner cursor-crosshair touch-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] bg-white block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                    Desenhe sua assinatura aqui
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DADOS CRIPTOGRÁFICOS DE AUDITORIA */}
          <div className="p-4 bg-slate-100 rounded-2xl space-y-1.5 text-[9px] font-mono text-slate-600">
            <div className="flex justify-between items-center">
              <span>CÓDIGO VERIFICADOR:</span>
              <strong className="text-emerald-800 font-black">{verificationCode}</strong>
            </div>
            <div className="flex justify-between items-center truncate">
              <span>HASH SHA-256:</span>
              <span className="text-slate-500 font-bold truncate max-w-xs">{documentHash || 'Calculando...'}</span>
            </div>
          </div>

          {/* DECLARAÇÃO DE RESPONSABILIDADE */}
          <label className="flex items-start gap-2.5 cursor-pointer text-[10px] text-slate-600 leading-snug">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Declaro a autenticidade e veracidade dos dados lançados neste documento sob as penas da Lei Federal nº 14.063/2020 e Art. 299 do Código Penal.
            </span>
          </label>

          {/* MENSAGEM DE ERRO */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in shake">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-3 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Autenticando e Assinando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Assinar Eletronicamente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ElectronicSignatureModal;
