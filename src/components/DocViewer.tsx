import React, { useState } from 'react';
import { DOCS_SECTIONS, DocSection } from '../data/docsContent';
import { BookOpen, Search, Copy, Check, ExternalLink, Bookmark, Hash, Terminal } from 'lucide-react';

export const DocViewer: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('async');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const filteredSections = DOCS_SECTIONS.filter(
    s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = DOCS_SECTIONS.find(s => s.id === activeSectionId) || DOCS_SECTIONS[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Navigation Sidebar (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter documentation..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Sections list */}
        <div className="space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1.5">
          {filteredSections.map(sec => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <Hash className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{sec.title}</span>
                    {sec.badge && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-emerald-400 font-mono">
                        {sec.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1">{sec.summary}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick cheat sheet card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Python SDK Cheatsheet</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span className="text-zinc-300">Client:</span>
              <span className="text-emerald-400">AsyncTypeSafeClient()</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span className="text-zinc-300">Inference:</span>
              <span className="text-emerald-400">await client.system_one()</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span className="text-zinc-300">Primitives:</span>
              <span className="text-emerald-400">choice, score, noul</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Retries:</span>
              <span className="text-emerald-400">408, 429, 5xx (exp backoff)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 font-semibold">#{activeSection.id}</span>
                {activeSection.badge && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                    {activeSection.badge}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-xl font-bold text-white tracking-tight">{activeSection.title}</h2>
            </div>

            <a
              href={`https://docs.typesafe.ai/sdk/python#${activeSection.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <span>View on docs.typesafe.ai</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Body Content */}
          <div className="mt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 whitespace-pre-line">
            {activeSection.content}
          </div>

          {/* Code Snippet Box */}
          {activeSection.codeSnippet && (
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 font-mono text-xs shadow-md">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
                <span className="text-zinc-400">{activeSection.codeSnippet.title}</span>
                <button
                  onClick={() =>
                    handleCopyCode(activeSection.codeSnippet!.code, activeSection.id)
                  }
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                >
                  {copiedIndex === activeSection.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto p-4 text-zinc-200 leading-relaxed">
                <pre>
                  <code>{activeSection.codeSnippet.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
