// @ts-nocheck

import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render(): ReactNode {
        const { hasError, error } = this.state;
        const { children } = this.props;

        if (hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={40} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Ops! Algo falhou.</h1>
                            <p className="text-sm text-gray-500 font-medium">
                                O sistema encontrou um erro inesperado, provavelmente devido a dados antigos salvos no seu navegador.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Detalhe Técnico</p>
                            <div className="text-[11px] font-bold text-red-500 overflow-hidden text-ellipsis">
                                {error?.message || 'Erro Desconhecido'}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                            >
                                <RefreshCw size={18} /> Tentar Recarregar
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                            >
                                <LogOut size={18} /> Limpar Tudo e Sair
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
                            Se o erro persistir, use uma janela anônima.
                        </p>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;
