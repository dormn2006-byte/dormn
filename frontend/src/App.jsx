import React, { useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import AppRoutes from "./routes/AppRoutes";
import IntroAnimation from "./components/IntroAnimation";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] dark:bg-black px-4 text-center">
          <div className="max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-black text-[#0D3A1D] dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {this.state.error?.message || "An unexpected error occurred while rendering this page."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-xl bg-[#93B733] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#82a32d] transition-all"
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              <a
                href="/"
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Home size={16} /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("dormn_intro"));

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("dormn_intro", "1");
    setShowIntro(false);
  }, []);

  return (
    <ErrorBoundary>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;