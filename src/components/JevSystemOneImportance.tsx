import React from 'react';
import { Cpu, Terminal, Check } from 'lucide-react';

export const JevSystemOneImportance: React.FC = () => {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-7 space-y-5 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                The Importance of the Jev Model
              </h3>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
                System One Architecture
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Direct structured decision-making for software systems vs traditional text-generation LLMs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-300 border border-zinc-700">
            <Terminal className="h-3 w-3 text-amber-400" />
            <span>No Text Generation • No Parsing</span>
          </span>
        </div>
      </div>

      {/* Core Lead Callout */}
      <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-4">
        <p className="text-sm sm:text-base font-semibold text-emerald-300 leading-relaxed">
          Jev is TypeSafe’s flagship model and the first System One model. Send state and typed questions; get structured answers your code can use directly.
        </p>
      </div>

      {/* Narrative Analysis: LLM Mismatch vs System One */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
        <div className="space-y-2.5 rounded-lg bg-zinc-950/60 p-4 border border-zinc-800/70">
          <div className="flex items-center gap-2 font-bold text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>The LLM Architectural Mismatch</span>
          </div>
          <p className="text-zinc-400">
            Large language models (LLMs) are designed to produce text for humans to read. When you need a model to make a judgment that your code will consume, that creates a mismatch: you are coercing a text-generation system into outputting structured decisions, then parsing the results back into something your code can depend on.
          </p>
        </div>

        <div className="space-y-2.5 rounded-lg bg-zinc-950/60 p-4 border border-zinc-800/70">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>The Jev System One Solution</span>
          </div>
          <p className="text-zinc-400">
            Jev is TypeSafe’s flagship model and the first System One model. System One models are built to make fast, structured decisions that software can use directly. Jev evaluates typed questions against a state and returns structured results directly. No text generation, no parsing. You get typed values and probability distributions that your code can branch on, sort by, and route with. Choice and Score also return confidence, which your code can use to decide whether and how to act on an answer.
          </p>
        </div>
      </div>

      {/* Direct Code Advantages Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-4 text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-zinc-300 font-medium">Branch on typed values</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-zinc-300 font-medium">Sort by probability distributions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-zinc-300 font-medium">Route with calibrated confidence scores</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-amber-400">
          Evaluated natively on live UK fuel pump &amp; wholesale spreads
        </span>
      </div>
    </div>
  );
};
