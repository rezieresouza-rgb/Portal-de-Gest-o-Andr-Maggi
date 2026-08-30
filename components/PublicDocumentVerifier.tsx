import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Calendar,
  User,
  X,
  Printer,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { ElectronicSignatureProof } from '../types';
import { verifySignatureByCode } from '../utils/signatureService';

interface PublicDocumentVerifierProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCode?: string;
}

export const PublicDocumentVerifier: React.FC<PublicDocumentVerifierProps> = ({
  isOpen = true,
  onClose,
  initialCode = ''
}) => {
  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [proof, setProof] = useState<ElectronicSignatureProof | null>(null);

  const handleVerify = async (codeToSearch?: string) => {
    const targetCode = (codeToSearch || verificationCode).trim().toUpperCase();
    if (!targetCode) return;

    setIsSearching(true);
    setSearched(true);

    try {
      const result = await verifySignatureByCode(targetCode);
      setProof(result);
    } catch (e) {
      console.error(e);
      setProof(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setVerificationCode(initialCode);
      handleVerify(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-emerald-500/30 animate-in zoom-in-95 max-h-[92vh]">
        
        {/* HEADER */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
              <ShieldCheck size={26} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 block mb-1">
                Serviço de Verificação Pública de Autenticidade
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                Conferência de Documentos Eletrônicos
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                E.E. Cívico-Militar André Antônio Maggi • Lei Federal nº 14.063/2020
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* BUSCA DE CÓDIGO */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/50">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              Digite o Código Verificador presente no rodapé do documento ou escaneado pelo QR Code:
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="Ex: AUTH-MAGGI-TER-8F2B-2026..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSearching ? 'Consultando...' : 'Verificar'}
              </button>
            </form>
          </div>

          {/* RESULTADO DA CONSULTA */}
          {searched && (
            <div>
              {proof ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in">
                  
                  {/* BADGE DE AUTENTICIDADE */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                        <CheckCircle2 size={28} />
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider inline-block mb-1">
                          ✓ Assinatura Válida e Íntegra
                        </span>
                        <h4 className="text-lg font-black uppercase text-slate-900 leading-tight">
                          Documento Oficial Autenticado
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-mono text-slate-400 block">CÓDIGO VERIFICADOR</span>
                      <span className="text-sm font-mono font-black text-emerald-800">{proof.verificationCode}</span>
                    </div>
                  </div>

                  {/* DADOS DETALHADOS DO CERTIFICADO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Documento</span>
                      <p className="font-black text-slate-900 uppercase text-sm">{proof.documentTitle}</p>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Tipo: {proof.documentType}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Signatário Oficial</span>
                      <p className="font-black text-slate-900 uppercase text-sm">{proof.signerName}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">
                        Cargo: {proof.signerRole} {proof.signerCpfOrMatricula && `• ${proof.signerCpfOrMatricula}`}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Data e Hora da Assinatura</span>
                      <p className="font-bold text-slate-900">
                        {new Date(proof.signedAt).toLocaleDateString('pt-BR')} às {new Date(proof.signedAt).toLocaleTimeString('pt-BR')}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">Carimbo de tempo oficial de Mato Grosso</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Método de Assinatura</span>
                      <p className="font-bold text-emerald-800 uppercase">
                        {proof.signatureType === 'SENHA_INSTITUCIONAL' ? '🔒 Senha Institucional Autenticada' :
                         proof.signatureType === 'TELA_TOUCH' ? '✍️ Assinatura em Tela Touch/Mouse' : 'Código de Confirmação'}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">{proof.legalBasis}</span>
                    </div>
                  </div>

                  {/* HASH SHA-256 */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1 text-left">
                    <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest block">
                      Resumo Criptográfico do Documento (Hash SHA-256)
                    </span>
                    <p className="font-mono text-[10px] font-bold text-emerald-950 break-all">
                      {proof.documentHash}
                    </p>
                    <p className="text-[8px] text-emerald-700 font-medium pt-1">
                      Este código matemático garante que o conteúdo do documento não sofreu qualquer adulteração após ser assinado.
                    </p>
                  </div>

                  {proof.touchSignatureDataUrl && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Assinatura Registrada em Tela Touch / Caneta Digital:
                      </span>
                      <img
                        src={proof.touchSignatureDataUrl}
                        alt="Assinatura Manuscrita Digital"
                        className="h-16 object-contain bg-white p-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3 animate-in fade-in">
                  <AlertTriangle size={36} className="mx-auto text-rose-500" />
                  <h4 className="text-base font-black text-rose-900 uppercase">
                    Documento Não Encontrado ou Código Inválido
                  </h4>
                  <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                    Não foi localizada nenhuma assinatura eletrônica registrada com o código <strong>"{verificationCode}"</strong>. Verifique se o código foi digitado corretamente ou consulte a secretaria escolar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicDocumentVerifier;
