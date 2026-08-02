import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4">
          <div className="bg-neutral-800 p-8 rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-red-400">Aplikasi Mengalami Kendala</h1>
            </div>
            
            <p className="text-neutral-300 mb-6 leading-relaxed">
              Maaf, terjadi kesalahan yang tidak terduga. Modul Error Boundary telah menangkap masalah ini untuk mencegah aplikasi berhenti sepenuhnya.
            </p>

            <div className="bg-neutral-950 p-4 rounded-xl mb-6 overflow-auto max-h-60 text-sm font-mono text-red-300/80 border border-neutral-800">
              <div className="font-bold mb-2">{this.state.error?.toString()}</div>
              <div className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-neutral-100 text-neutral-900 px-6 py-3 rounded-full font-medium hover:bg-white transition-colors w-full justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
