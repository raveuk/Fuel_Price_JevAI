import React, { useState } from 'react';
import { PRESET_SCENARIOS, simulateSystemOneEvaluation } from '../data/presets';
import { PresetScenario, Question, QuestionResult, EvaluationResult } from '../types';
import { TypeSafeResponseCard } from './TypeSafeResponseCard';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Code2,
  Sparkles,
  Zap,
  Sliders,
  CheckSquare,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface AsyncPlaygroundProps {
  onOpenCodeGen: () => void;
  state: string;
  setState: (st: string) => void;
  questions: Question[];
  setQuestions: (q: Question[]) => void;
}

export const AsyncPlayground: React.FC<AsyncPlaygroundProps> = ({
  onOpenCodeGen,
  state,
  setState,
  questions,
  setQuestions
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [jsonView, setJsonView] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Initialize with the first preset
  const handleSelectPreset = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    setState(preset.state);
    setQuestions([...preset.questions]);
    setEvaluationResult(null);
  };

  const handleEvaluate = () => {
    setIsEvaluating(true);

    setTimeout(() => {
      const simulatedLatency = Math.floor(25 + Math.random() * 25);
      const results = simulateSystemOneEvaluation(state, questions);

      setEvaluationResult({
        id: 'eval-' + Date.now(),
        statePreview: state.slice(0, 100) + '...',
        latencyMs: simulatedLatency,
        status: 'success',
        results,
        timestamp: new Date().toISOString()
      });
      setIsEvaluating(false);
    }, 280);
  };

  const handleAddQuestion = (type: 'choice' | 'score' | 'noul') => {
    const id = `q_${Date.now()}`;
    if (type === 'choice') {
      setQuestions([
        ...questions,
        {
          type: 'choice',
          id,
          name: `category_${questions.length + 1}`,
          prompt: 'Select the primary classification',
          options: ['option-a', 'option-b', 'option-c']
        }
      ]);
    } else if (type === 'score') {
      setQuestions([
        ...questions,
        {
          type: 'score',
          id,
          name: `severity_${questions.length + 1}`,
          prompt: 'Rate severity on ordered scale',
          levels: ['low', 'medium', 'high', 'critical']
        }
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          type: 'noul',
          id,
          name: `flag_${questions.length + 1}`,
          statement: 'Does this record meet criteria for immediate automated intervention?'
        }
      ]);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleCopyJson = () => {
    if (!evaluationResult) return;
    navigator.clipboard.writeText(JSON.stringify(evaluationResult.results, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Presets Selector */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Select Preset Domain Scenario:
          </label>
          <span className="text-xs text-zinc-500 font-mono">System One Fast Decision Primitives</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRESET_SCENARIOS.map(preset => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <span className="text-sm font-semibold">{preset.title}</span>
                <span className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </span>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <span>{preset.questions.length} questions</span>
                  <span>•</span>
                  <span>{preset.questions.map(q => q.type[0].toUpperCase()).join('/')}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: State Input (Left) & Questions / Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: State Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Evaluation State
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                JSON or Text
              </span>
            </div>
            <button
              onClick={() => {
                const p = PRESET_SCENARIOS.find(p => p.id === selectedPresetId);
                if (p) setState(p.state);
              }}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
              title="Reset state to default preset"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-inner">
            <textarea
              id="state-editor-textarea"
              value={state}
              onChange={e => setState(e.target.value)}
              rows={16}
              className="w-full resize-none rounded-lg bg-transparent p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Enter JSON state or raw text message..."
            />
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Best Practice:</strong> Pass the raw structured document directly
            rather than composing a prompt. TypeSafe models evaluate questions directly against the state data shape.
          </p>
        </div>

        {/* Right Column: Questions & Execution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Typed Questions ({questions.length})
              </span>
              <span className="text-xs text-zinc-500 font-mono">Parallel In-flight</span>
            </div>

            {/* Add question buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddQuestion('choice')}
                className="flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-200 transition-colors"
                title="Add discrete Choice question"
              >
                <Plus className="h-3 w-3 text-sky-400" />
                <span>+ Choice</span>
              </button>
              <button
                onClick={() => handleAddQuestion('score')}
                className="flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-200 transition-colors"
                title="Add ordered Score rubric"
              >
                <Plus className="h-3 w-3 text-amber-400" />
                <span>+ Score</span>
              </button>
              <button
                onClick={() => handleAddQuestion('noul')}
                className="flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs text-zinc-200 transition-colors"
                title="Add boolean Noul proposition"
              >
                <Plus className="h-3 w-3 text-purple-400" />
                <span>+ Noul</span>
              </button>
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                        q.type === 'choice'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : q.type === 'score'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {q.type[0].toUpperCase()}
                    </span>
                    <input
                      type="text"
                      value={q.name}
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[idx].name = e.target.value;
                        setQuestions(newQ);
                      }}
                      className="rounded bg-zinc-950 px-2 py-0.5 font-mono text-xs font-semibold text-white border border-zinc-800 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-500 font-mono">({q.type})</span>
                  </div>

                  {questions.length > 1 && (
                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Prompt or Statement */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={q.type === 'noul' ? q.statement : q.prompt}
                    onChange={e => {
                      const newQ = [...questions];
                      if (q.type === 'noul') {
                        (newQ[idx] as any).statement = e.target.value;
                      } else {
                        (newQ[idx] as any).prompt = e.target.value;
                      }
                      setQuestions(newQ);
                    }}
                    placeholder="Enter question prompt or statement..."
                    className="w-full rounded bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-300 border border-zinc-800/80 focus:border-zinc-600 focus:outline-none"
                  />
                </div>

                {/* Options / Levels */}
                {q.type === 'choice' && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">Options:</span>
                    {q.options.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="rounded-md bg-zinc-800/90 px-2 py-0.5 font-mono text-[11px] text-sky-300 border border-zinc-700/60"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}

                {q.type === 'score' && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">Levels:</span>
                    {q.levels.map((lvl, lIdx) => (
                      <span
                        key={lIdx}
                        className="rounded-md bg-zinc-800/90 px-2 py-0.5 font-mono text-[11px] text-amber-300 border border-zinc-700/60"
                      >
                        {lIdx + 1}. {lvl}
                      </span>
                    ))}
                  </div>
                )}

                {q.type === 'noul' && (
                  <div className="mt-2 text-[11px] font-mono text-purple-300/80">
                    Predicts probability of truth in range [0.0 - 1.0]
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                id="evaluate-async-btn"
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <Zap className="h-4 w-4 animate-pulse text-amber-300" />
                    <span>Inference in-flight...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run await client.system_one()</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenCodeGen}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2.5 text-xs font-medium text-zinc-200 border border-zinc-700/60 transition-colors"
                title="Inspect generated Python code"
              >
                <Code2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>View Python Script</span>
              </button>
            </div>

            {evaluationResult && (
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{evaluationResult.latencyMs}ms</span>
                </span>
                <span>•</span>
                <span className="text-zinc-500">HTTP 200 OK</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {evaluationResult && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-semibold text-white text-base">
                AsyncTypeSafeClient Evaluation Response
              </h3>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400 border border-emerald-500/20">
                Jev Model Result
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setJsonView(!jsonView)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                  jsonView
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {jsonView ? 'Visual Cards' : 'Raw JSON Schema'}
              </button>
              {jsonView && (
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            {jsonView ? (
              <pre className="overflow-x-auto rounded-xl bg-zinc-900/80 p-4 font-mono text-xs text-emerald-400 border border-zinc-800">
                <code>{JSON.stringify(evaluationResult.results, null, 2)}</code>
              </pre>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(evaluationResult.results).map(([qName, res]) => (
                  <TypeSafeResponseCard key={qName} questionName={qName} result={res} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
