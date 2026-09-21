import React, { useState } from 'react';
import { QuestionResult, ChoiceResponse, ScoreResponse, NoulResponse } from '../types';
import { CheckCircle2, XCircle, BarChart3, Sliders, CheckSquare, Code2, ChevronDown, ChevronUp } from 'lucide-react';

interface TypeSafeResponseCardProps {
  questionName: string;
  result: QuestionResult;
}

export const TypeSafeResponseCard: React.FC<TypeSafeResponseCardProps> = ({ questionName, result }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (result.type === 'choice') {
    const choiceRes = result as ChoiceResponse;
    const sortedProbabilities = Object.entries(choiceRes.probabilities).sort((a, b) => b[1] - a[1]);

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition-all hover:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold">
              C
            </span>
            <div>
              <span className="font-mono text-xs text-zinc-400">choice:</span>{' '}
              <span className="font-semibold text-white text-sm">{questionName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/90 px-2.5 py-0.5 text-xs text-zinc-300 border border-zinc-700/50">
            <span className="text-zinc-500">conf:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {(choiceRes.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Selected Winning Choice */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-950/80 px-3 py-2.5 border border-zinc-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-white tracking-wide">
              {choiceRes.choice}
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {((choiceRes.probabilities[choiceRes.choice] || 0) * 100).toFixed(1)}% prob
          </span>
        </div>

        {/* Probability Bars */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Probability Distribution</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 hover:text-zinc-300 text-zinc-400"
            >
              <span>{showDetails ? 'Hide' : 'All Options'}</span>
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {(showDetails ? sortedProbabilities : sortedProbabilities.slice(0, 3)).map(([opt, prob]) => {
            const isWinner = opt === choiceRes.choice;
            const pct = (prob * 100).toFixed(1);
            return (
              <div key={opt} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className={isWinner ? 'font-medium text-emerald-300' : 'text-zinc-400'}>
                    {opt}
                  </span>
                  <span className={isWinner ? 'font-bold text-emerald-400' : 'text-zinc-500'}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWinner ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                    style={{ width: `${Math.max(2, prob * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (result.type === 'score') {
    const scoreRes = result as ScoreResponse;
    const sortedProbabilities = Object.entries(scoreRes.probabilities);

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition-all hover:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
              S
            </span>
            <div>
              <span className="font-mono text-xs text-zinc-400">score:</span>{' '}
              <span className="font-semibold text-white text-sm">{questionName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/90 px-2.5 py-0.5 text-xs text-zinc-300 border border-zinc-700/50">
            <span className="text-zinc-500">conf:</span>
            <span className="font-mono font-semibold text-amber-400">
              {(scoreRes.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Selected Score Badge and Step Progression */}
        <div className="mt-3 rounded-lg bg-zinc-950/80 p-3 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                {scoreRes.score}
              </span>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              Level {scoreRes.levelIndex + 1} of {scoreRes.totalLevels}
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="mt-2.5 flex items-center gap-1.5">
            {Array.from({ length: scoreRes.totalLevels }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  idx <= scoreRes.levelIndex
                    ? idx === scoreRes.levelIndex
                      ? 'bg-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-amber-600/70'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Distribution */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Ordered Level Probabilities</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sortedProbabilities.map(([lvl, prob]) => {
              const isWinner = lvl === scoreRes.score;
              return (
                <div
                  key={lvl}
                  className={`rounded-md p-1.5 text-center font-mono text-xs border ${
                    isWinner
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="truncate">{lvl}</div>
                  <div className={isWinner ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (result.type === 'noul') {
    const noulRes = result as NoulResponse;
    const isTrue = noulRes.boolean;
    const pct = (noulRes.probability * 100).toFixed(1);

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition-all hover:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
              N
            </span>
            <div>
              <span className="font-mono text-xs text-zinc-400">noul:</span>{' '}
              <span className="font-semibold text-white text-sm">{questionName}</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              isTrue
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {isTrue ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>TRUE</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                <span>FALSE</span>
              </>
            )}
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="mt-3 rounded-lg bg-zinc-950/80 p-3 border border-zinc-800">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-400">Probability of Truth</span>
            <span className={`font-bold text-sm ${isTrue ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {noulRes.probability.toFixed(3)} ({pct}%)
            </span>
          </div>

          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            {/* Threshold 0.5 marker */}
            <div className="absolute top-0 bottom-0 left-1/2 z-10 w-0.5 bg-zinc-500 opacity-60" />
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTrue ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-zinc-500'
              }`}
              style={{ width: `${Math.max(2, noulRes.probability * 100)}%` }}
            />
          </div>

          <div className="mt-1.5 flex justify-between text-[10px] font-mono text-zinc-500">
            <span>0.0 (Definitely False)</span>
            <span className="text-zinc-400">threshold: 0.50</span>
            <span>1.0 (Definitely True)</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
