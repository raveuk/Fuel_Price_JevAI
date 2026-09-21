import React from 'react';
import { ExternalLink, Terminal, ShieldCheck, Fuel } from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab = 'diesel', setActiveTab }) => {
  const { hasServerKey, isSavedLocal, effectiveKeyPresent } = useApiKey();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand & Docs URL badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">TypeSafe AI</span>
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-700/60">
                Python SDK
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                #async
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono hidden md:block">
              AsyncTypeSafeClient • Jev System One Engine
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs - Fuel Prices Only */}
        <nav className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
          <button
            id="nav-tab-diesel"
            onClick={() => setActiveTab?.('diesel')}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap bg-amber-500 text-zinc-950 shadow-sm shadow-amber-950/30"
          >
            <Fuel className="h-3.5 w-3.5 text-zinc-950" />
            <span>Fuel Prices</span>
          </button>
        </nav>

        {/* Right: Key Status & Direct Docs Link */}
        <div className="flex items-center gap-2">
          {effectiveKeyPresent ? (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-mono text-emerald-300"
              title={hasServerKey ? "Using TYPESAFE_API_KEY from server environment" : "API Key remembered in browser storage"}
            >
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>{hasServerKey ? "Env Key Active" : "Key Saved"}</span>
            </div>
          ) : (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-400"
              title="No API key configured. Using calibrated sequence simulator."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Offline Mode</span>
            </div>
          )}

          <a
            id="external-official-docs-link"
            href="https://docs.typesafe.ai/sdk/python#async"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 border border-zinc-700/60 transition-colors"
            title="Open official documentation"
          >
            <span className="hidden lg:inline text-zinc-400">docs.typesafe.ai/sdk/python#async</span>
            <span className="lg:hidden text-zinc-300">docs.typesafe.ai</span>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
