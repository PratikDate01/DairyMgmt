import React from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { withTranslation } from 'react-i18next';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    const errorDetails = {
      message: error?.message || String(error),
      name: error?.name,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      search: typeof window !== 'undefined' ? window.location.search : '',
      timestamp: new Date().toISOString(),
      language: typeof localStorage !== 'undefined' ? localStorage.getItem('gauseva_language') || localStorage.getItem('i18nextLng') : 'en'
    };
    console.error('CRITICAL RENDERING EXCEPTION CAUGHT BY ErrorBoundary:', errorDetails);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-xl w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('errorBoundary.title', 'Something went wrong')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('errorBoundary.desc', 'An unexpected error occurred while rendering this section. You can reload this view or navigate back to the dashboard.')}
              </p>
            </div>

            {/* Developer Diagnostic Box (Only in Development) */}
            {isDev && this.state.error && (
              <div className="text-left bg-red-50/80 border border-red-200 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-red-800 font-bold">
                  <span>Exception: {this.state.error.message || String(this.state.error)}</span>
                  <button
                    onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                    className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                  >
                    <span>{this.state.showDetails ? 'Hide' : 'Details'}</span>
                    {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {this.state.showDetails && (
                  <pre className="mt-2 p-2 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('errorBoundary.tryAgain', 'Try Again')}</span>
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t('errorBoundary.dashboard', 'Dashboard')}</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
