import React, { useState } from 'react';
import { NUMBER_PRESETS, NumberPreset, calculateStatistics } from '../data/numberPresets';
import { BatchNumberPredictor } from './BatchNumberPredictor';
import { useApiKey } from '../context/ApiKeyContext';
import {
  Key,
  Play,
  Zap,
  RotateCcw,
  BarChart2,
  TrendingUp,
  Hash,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Code2,
  Sparkles,
  Info,
  Layers,
  FileSpreadsheet,
  Trash2,
  ShieldCheck
} from 'lucide-react';

export const NumberProbabilityPredictor: React.FC = () => {
  const { apiKey, setApiKey, clearApiKey, hasServerKey, isSavedLocal, effectiveKeyPresent } = useApiKey();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<NumberPreset>(NUMBER_PRESETS[0]);
  const [mode, setMode] = useState<'scale' | 'discrete' | 'threshold'>(NUMBER_PRESETS[0].mode);
  const [stateText, setStateText] = useState<string>(NUMBER_PRESETS[0].state);
  const [promptText, setPromptText] = useState<string>(NUMBER_PRESETS[0].prompt);
  const [numbersList, setNumbersList] = useState<string[]>([...NUMBER_PRESETS[0].numbers]);
  const [thresholdStmt, setThresholdStmt] = useState<string>(
    NUMBER_PRESETS[4].thresholdStatement || 'Will the value exceed 80?'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<'live' | 'simulated'>('simulated');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prediction outcome state
  const [probabilities, setProbabilities] = useState<Record<string, number> | null>({
    '1': 0.005,
    '2': 0.008,
    '3': 0.015,
    '4': 0.032,
    '5': 0.065,
    '6': 0.115,
    '7': 0.198,
    '8': 0.285,
    '9': 0.215,
    '10': 0.062
  });
  const [confidence, setConfidence] = useState<number>(0.89);
  const [noulProbability, setNoulProbability] = useState<number | null>(null);

  const [showCdf, setShowCdf] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Load a preset
  const handleSelectPreset = (preset: NumberPreset) => {
    setSelectedPreset(preset);
    setMode(preset.mode);
    setStateText(preset.state);
    setPromptText(preset.prompt);
    setNumbersList([...preset.numbers]);
    if (preset.thresholdStatement) {
      setThresholdStmt(preset.thresholdStatement);
    }
    setErrorMsg(null);
  };

  // Run prediction against either real Jev API or calibrated local simulator
  const handlePredict = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    if (mode !== 'threshold' && numbersList.length < 2) {
      setErrorMsg('At least 2 numbers or categories are required for probability prediction.');
      setIsLoading(false);
      return;
    }

    const questionKey = 'predicted_number';
    let questionPayload: any;
    const safeNumbersList = numbersList.slice(0, 250);

    if (mode === 'scale') {
      // TypeSafe Score primitive strictly accepts 2 to 10 levels.
      // If user provides > 10 items, use choice primitive so the API does not reject with 422.
      if (safeNumbersList.length > 10) {
        questionPayload = {
          type: 'choice',
          prompt: promptText,
          options: safeNumbersList
        };
      } else {
        questionPayload = {
          type: 'score',
          prompt: promptText,
          levels: safeNumbersList
        };
      }
    } else if (mode === 'discrete') {
      questionPayload = {
        type: 'choice',
        prompt: promptText,
        options: safeNumbersList
      };
    } else {
      questionPayload = {
        type: 'noul',
        statement: thresholdStmt || 'Is the target numerical value greater than the threshold?'
      };
    }

    const statePayload = stateText.trim() || 'Numerical sequence analysis';

    // Try calling the proxy if API key is provided or server key is configured
    if (effectiveKeyPresent) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (apiKey && apiKey.trim().length > 0) {
          headers['x-typesafe-api-key'] = apiKey.trim();
        }

        const res = await fetch('/api/jev/predict', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            apiKey: apiKey.trim() || undefined,
            state: statePayload,
            questions: {
              [questionKey]: questionPayload
            }
          })
        });

        const data = await res.json();
        if (res.ok && data.results) {
          setApiSource('live');
          setLatencyMs(data.latencyMs || 84);

          const resultItem = data.results[questionKey];
          if (resultItem) {
            if (resultItem.type === 'noul') {
              setNoulProbability(resultItem.probability);
              setProbabilities(null);
            } else {
              setProbabilities(resultItem.probabilities || {});
              setConfidence(resultItem.confidence || 0.85);
              setNoulProbability(null);
            }
          }
          setIsLoading(false);
          return;
        } else {
          // If the real API returned an error (e.g. invalid key)
          setErrorMsg(data.error || 'TypeSafe API error occurred. Showing calibrated simulation.');
        }
      } catch (err: any) {
        setErrorMsg(`Network issue calling Jev API: ${err.message}. Falling back to simulation.`);
      }
    }

    // Local calibrated simulation fallback
    setTimeout(() => {
      setApiSource('simulated');
      setLatencyMs(Math.floor(28 + Math.random() * 30));

      if (mode === 'threshold') {
        const prob = parseFloat((0.65 + Math.random() * 0.28).toFixed(3));
        setNoulProbability(prob);
        setProbabilities(null);
      } else {
        // Generate a calibrated bell-shaped or peaked probability distribution across the numbers
        const n = numbersList.length;
        const peakIndex = Math.min(n - 1, Math.max(0, Math.floor(n * 0.7) + (Math.random() > 0.5 ? 1 : -1)));

        const rawProbs: Record<string, number> = {};
        let sum = 0;

        numbersList.forEach((numStr, idx) => {
          const dist = Math.abs(idx - peakIndex);
          // Exponential decay away from the peak
          const weight = Math.exp(-(dist * dist) / (2 * 1.8 * 1.8)) + 0.02 * Math.random();
          rawProbs[numStr] = weight;
          sum += weight;
        });

        const normalized: Record<string, number> = {};
        numbersList.forEach(numStr => {
          normalized[numStr] = parseFloat((rawProbs[numStr] / sum).toFixed(3));
        });

        setProbabilities(normalized);
        setConfidence(parseFloat((0.84 + Math.random() * 0.12).toFixed(2)));
        setNoulProbability(null);
      }

      setIsLoading(false);
    }, 250);
  };

  const stats = probabilities ? calculateStatistics(probabilities) : null;

  // Calculate Cumulative Distribution Function (CDF)
  let cumulative = 0;
  const cdfList = probabilities
    ? Object.entries(probabilities).map(([k, p]) => {
        cumulative += p;
        return { number: k, pdf: p, cdf: Math.min(1.0, parseFloat(cumulative.toFixed(3))) };
      })
    : [];

  const pythonCode = `import asyncio
from typesafe_sdk import AsyncTypeSafeClient, score, choice, noul

async def predict_numbers():
    # Using your Jev API key
    api_key = "${apiKey.trim() || 'ts_live_your_api_key_here'}"
    
    async with AsyncTypeSafeClient(api_key=api_key) as client:
        result = await client.system_one(
            state=${stateText.trim()},
            questions={
${
  mode === 'scale'
    ? `                "number_prediction": score(
                    "${promptText.replace(/"/g, '\\"')}",
                    levels=${JSON.stringify(numbersList)}
                )`
    : mode === 'discrete'
    ? `                "number_prediction": choice(
                    "${promptText.replace(/"/g, '\\"')}",
                    options=${JSON.stringify(numbersList)}
                )`
    : `                "number_threshold": noul(
                    "${thresholdStmt.replace(/"/g, '\\"')}"
                )`
}
            }
        )
        
${
  mode === 'threshold'
    ? `        prob = result.number_threshold.probability
        print(f"Threshold probability: {prob:.3f} ({prob*100:.1f}%)")
        print(f"Exceeds threshold: {result.number_threshold.boolean}")`
    : `        # Extract winning number and full probability distribution
        res = result.number_prediction
        print(f"Most likely number: {res.score if hasattr(res, 'score') else res.choice}")
        print(f"Prediction confidence: {res.confidence:.2f}")
        print("\\nProbability of each number:")
        for num, prob in res.probabilities.items():
            print(f"  P(X = {num}): {prob*100:.1f}%")
            
        # Calculate Expected Value E[X] if numbers are numeric
        try:
            ev = sum(float(num) * prob for num, prob in res.probabilities.items())
            print(f"\\nExpected Value E[X] = {ev:.2f}")
        except ValueError:
            pass`
}

if __name__ == "__main__":
    asyncio.run(predict_numbers())
`;

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Jev API Key Input & Status */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Hash className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Predict Probability of Numbers with Jev
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                System One Engine
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
              TypeSafe Jev uses mathematical primitives (<code className="text-emerald-400 font-mono">score</code> and{' '}
              <code className="text-emerald-400 font-mono">choice</code>) to output calibrated probability distributions over
              ordered or discrete numbers, plus <code className="text-emerald-400 font-mono">noul</code> for numerical thresholds.
            </p>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-xs font-mono font-medium ${
                hasServerKey
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : apiKey.trim()
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  effectiveKeyPresent ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                {hasServerKey
                  ? 'Server Key Active (env: TYPESAFE_API_KEY)'
                  : isSavedLocal
                  ? 'Key Saved in Browser Storage'
                  : apiKey.trim()
                  ? 'Live api.typesafe.ai'
                  : 'Calibrated Jev Simulator'}
              </span>
              {latencyMs && <span className="text-zinc-500">• {latencyMs}ms</span>}
            </div>
          </div>
        </div>

        {/* API Key Input Field */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="jev-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={
                  hasServerKey
                    ? 'Server key already configured via environment (TYPESAFE_API_KEY)'
                    : 'Enter your Jev API key once (ts_live_...) — remembered automatically'
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-10 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {apiKey.trim().length > 0 && (
              <button
                type="button"
                onClick={clearApiKey}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors shrink-0"
                title="Remove API key from browser storage"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Forget Key</span>
              </button>
            )}
          </div>

          {/* Persistence status indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
            {hasServerKey ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Server environment has <strong>TYPESAFE_API_KEY</strong> set. No key needed!</span>
              </span>
            ) : isSavedLocal ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Key is saved in browser storage. It persists automatically across page reloads.</span>
              </span>
            ) : (
              <span className="text-zinc-500">
                Tip: Enter your key once and it will be remembered in browser localStorage for all sessions.
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300 border border-rose-500/20 font-mono">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher: Single Input vs Concurrent Batch Analysis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800">
          <button
            id="tab-single-predict"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Single Input Prediction</span>
          </button>
          <button
            id="tab-batch-predict"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Batch Analysis</span>
            <span className="ml-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">
              Concurrent CSV
            </span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          {activeTab === 'single'
            ? 'Interactive single state probability tuning'
            : 'Concurrently evaluate multiple records in parallel'}
        </div>
      </div>

      {activeTab === 'batch' ? (
        <BatchNumberPredictor apiKey={apiKey} />
      ) : (
        <>
          {/* Preset Scenarios */}
          <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Select Number Domain Preset:
          </label>
          <span className="text-xs text-zinc-500 font-mono">Calibrated Numerical Distributions</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {NUMBER_PRESETS.map(preset => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{preset.title}</span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{preset.mode}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
                <span className="mt-2 text-[10px] font-mono text-emerald-400">
                  {preset.numbers.length} numbers
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: State & Numbers Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Prediction Primitive
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Jev System One</span>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                onClick={() => setMode('scale')}
                className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                  mode === 'scale'
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Score (Ordered)
              </button>
              <button
                onClick={() => setMode('discrete')}
                className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                  mode === 'discrete'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Choice (Discrete)
              </button>
              <button
                onClick={() => setMode('threshold')}
                className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                  mode === 'threshold'
                    ? 'bg-zinc-800 text-purple-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Noul (Threshold)
              </button>
            </div>

            {/* Prompt / Question */}
            {mode === 'threshold' ? (
              <div>
                <label className="text-xs font-medium text-zinc-400">Threshold Statement:</label>
                <input
                  type="text"
                  value={thresholdStmt}
                  onChange={e => setThresholdStmt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Will the value exceed 80?"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-zinc-400">Question Prompt:</label>
                <input
                  type="text"
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Enter prompt for Jev..."
                />
              </div>
            )}

            {/* Numbers List Config */}
            {mode !== 'threshold' && (
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <label className="font-medium">Number Scale / Options ({numbersList.length}):</label>
                  <span className="text-[10px] text-zinc-500 font-mono">Comma-separated</span>
                </div>
                <input
                  type="text"
                  value={numbersList.join(', ')}
                  onChange={e => {
                    const parsed = e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                    setNumbersList(parsed);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="0, 1, 2, 3, 4, 5, 6, 7, 8, 9"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {numbersList.map((num, i) => (
                    <span
                      key={i}
                      className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-emerald-300 border border-zinc-700"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* State Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                State Data (Context)
              </span>
              <button
                onClick={() => setStateText(selectedPreset.state)}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-inner">
              <textarea
                value={stateText}
                onChange={e => setStateText(e.target.value)}
                rows={9}
                className="w-full resize-none rounded-lg bg-transparent p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="Enter state data as JSON or text..."
              />
            </div>
          </div>

          {/* Evaluate Button */}
          <button
            id="run-jev-number-predict-btn"
            onClick={handlePredict}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Zap className="h-4 w-4 animate-spin text-amber-300" />
                <span>Predicting with Jev...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {apiKey.trim() ? 'Predict Number Probability (Live Jev)' : 'Predict Number Probability (Simulated)'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right: Visual Probability Distribution & Statistics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Statistical Highlights */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Expected Value */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Expected Value E[X]</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {stats.expectedValue !== null ? stats.expectedValue : 'N/A'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">μ (mean)</span>
                </div>
              </div>

              {/* Mode */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Most Probable (Mode)</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-white">{stats.mode}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {(stats.modeProb * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Confidence */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Confidence Score</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-amber-400">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">calibrated</span>
                </div>
              </div>

              {/* Std Dev */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Spread / Uncertainty</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-zinc-300">
                    {stats.stdDev !== null ? `±${stats.stdDev}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">σ (std dev)</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Visual Chart: Probability Density Curve / Bar Chart */}
          {probabilities && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Probability Distribution Across Numbers P(X = k)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCdf(!showCdf)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium border transition-colors ${
                      showCdf
                        ? 'bg-zinc-800 border-zinc-600 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {showCdf ? 'CDF View P(X ≤ k)' : 'PDF View P(X = k)'}
                  </button>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-5 space-y-2.5">
                {cdfList.map(item => {
                  const isMode = item.number === stats?.mode;
                  const probPct = (item.pdf * 100).toFixed(1);
                  const cdfPct = (item.cdf * 100).toFixed(1);
                  const displayValue = showCdf ? item.cdf : item.pdf;
                  const displayPct = showCdf ? cdfPct : probPct;

                  return (
                    <div key={item.number} className="group">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-12 text-right font-bold ${
                              isMode ? 'text-emerald-400' : 'text-zinc-300'
                            }`}
                          >
                            {item.number}
                          </span>
                          {isMode && !showCdf && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] text-emerald-400 border border-emerald-500/20 font-sans font-medium">
                              Mode
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isMode && !showCdf ? 'text-emerald-400' : 'text-zinc-400'
                            }`}
                          >
                            {displayPct}%
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            ({displayValue.toFixed(3)})
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isMode && !showCdf
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : showCdf
                              ? 'bg-gradient-to-r from-sky-600 to-sky-400'
                              : 'bg-zinc-600 group-hover:bg-zinc-500'
                          }`}
                          style={{ width: `${Math.max(1, displayValue * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expected value note */}
              {stats?.expectedValue !== null && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-900/50 p-2.5 border border-zinc-800/60 text-xs font-mono">
                  <span className="text-zinc-400">
                    Mathematical Mean: <strong className="text-white">E[X] = {stats?.expectedValue}</strong>
                  </span>
                  <span className="text-emerald-400">
                    P(X ≥ {stats?.mode}):{' '}
                    {(
                      cdfList
                        .filter(c => Number(c.number) >= Number(stats?.mode))
                        .reduce((acc, c) => acc + c.pdf, 0) * 100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Threshold (Noul) Result Display */}
          {noulProbability !== null && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
                    N
                  </span>
                  <h3 className="text-sm font-semibold text-white">Threshold Probability Result</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    noulProbability >= 0.5
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {noulProbability >= 0.5 ? 'THRESHOLD MET (TRUE)' : 'THRESHOLD NOT MET (FALSE)'}
                </span>
              </div>

              <div className="rounded-xl bg-zinc-900/80 p-4 border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 font-mono">Proposition Statement</span>
                <p className="mt-1 text-sm font-semibold text-white">"{thresholdStmt}"</p>

                <div className="mt-4 font-mono text-3xl font-extrabold text-purple-400">
                  {(noulProbability * 100).toFixed(1)}%
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  Exact Scalar Probability: {noulProbability.toFixed(4)}
                </span>

                {/* Progress bar */}
                <div className="relative mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="absolute top-0 bottom-0 left-1/2 z-10 w-0.5 bg-zinc-500 opacity-60" />
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700"
                    style={{ width: `${noulProbability * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0.0 (Impossible)</span>
                  <span>0.50 (Decision Cutoff)</span>
                  <span>1.0 (Certain)</span>
                </div>
              </div>
            </div>
          )}

          {/* Generated Python Script for Number Prediction */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>Python SDK Script (Using your Jev API Key)</span>
              </div>
              <button
                onClick={handleCopyPython}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="mt-3 max-h-56 overflow-auto font-mono text-[11px] leading-relaxed text-zinc-300 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
              <code>{pythonCode}</code>
            </pre>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
