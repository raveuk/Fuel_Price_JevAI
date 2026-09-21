import React from 'react';
import { Header } from './components/Header';
import { DieselPricePredictor } from './components/DieselPricePredictor';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { Terminal, ExternalLink, Fuel, Activity } from 'lucide-react';

function AppContent() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
      {/* Top Header */}
      <Header activeTab="diesel" />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {/* Sole Dedicated View: Live Fuel Prices & Jev Prediction Engine */}
        <DieselPricePredictor />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-900 bg-zinc-950 py-8 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">TypeSafe AI Python SDK</span>
            <span>•</span>
            <span>Jev System One Decision Engine</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://docs.typesafe.ai/sdk/python#async"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <span>docs.typesafe.ai/sdk/python#async</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>•</span>
            <span className="font-mono text-zinc-600">pip install typesafe-sdk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  );
}
