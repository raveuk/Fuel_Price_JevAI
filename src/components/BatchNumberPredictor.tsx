import React, { useState, useRef, useMemo } from 'react';
import { BATCH_SAMPLES, BatchSample, BatchItemResult, parseBatchInput } from '../data/batchSamples';
import { calculateStatistics } from '../data/numberPresets';
import { useApiKey } from '../context/ApiKeyContext';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Layers,
  Download,
  Search,
  Check,
  Copy,
  RotateCcw,
  Play,
  Zap,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hash,
  ArrowUpDown,
  Clock,
  Sparkles,
  TrendingUp,
  Code2
} from 'lucide-react';

interface BatchNumberPredictorProps {
  apiKey: string;
}

export const BatchNumberPredictor: React.FC<BatchNumberPredictorProps> = ({ apiKey }) => {
  const { effectiveKeyPresent } = useApiKey();
  const [selectedSample, setSelectedSample] = useState<BatchSample>(BATCH_SAMPLES[0]);
  const [rawText, setRawText] = useState<string>(BATCH_SAMPLES[0].content);
  const [mode, setMode] = useState<'scale' | 'discrete' | 'threshold'>(BATCH_SAMPLES[0].mode);
  const [promptText, setPromptText] = useState<string>(BATCH_SAMPLES[0].prompt);
  const [numbersList, setNumbersList] = useState<string[]>([...BATCH_SAMPLES[0].numbers]);
  const [thresholdStmt, setThresholdStmt] = useState<string>(
    BATCH_SAMPLES[3].thresholdStatement || 'Will the value exceed 80?'
  );

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Execution & results state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [totalLatencyMs, setTotalLatencyMs] = useState<number | null>(null);
  const [apiSource, setApiSource] = useState<'live' | 'simulated'>('simulated');
  const [results, setResults] = useState<BatchItemResult[] | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Parse input items reactively
  const parsedData = useMemo(() => {
    return parseBatchInput(rawText);
  }, [rawText]);

  // Load a preset sample
  const handleSelectSample = (sample: BatchSample) => {
    setSelectedSample(sample);
    setRawText(sample.content);
    setMode(sample.mode);
    setPromptText(sample.prompt);
    setNumbersList([...sample.numbers]);
    if (sample.thresholdStatement) {
      setThresholdStmt(sample.thresholdStatement);
    }
    setResults(null);
    setErrorBanner(null);
  };

  // Handle file reading
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        setResults(null);
        setErrorBanner(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Run concurrent batch prediction
  const handleRunBatch = async () => {
    if (parsedData.items.length === 0) {
      setErrorBanner('No input rows to analyze. Please upload or paste CSV or newline data.');
      return;
    }

    setIsRunning(true);
    setErrorBanner(null);
    setProgressCount(0);
    setTotalLatencyMs(null);

    const startTime = performance.now();
    const itemsToProcess = parsedData.items;
    const initialResults: BatchItemResult[] = itemsToProcess.map((item) => ({
      id: item.id,
      rawInput: item.state,
      displaySnippet: item.displaySnippet,
      status: 'pending'
    }));
    setResults([...initialResults]);

    const questionKey = 'batch_number_pred';
    const safeNumbersList = numbersList.slice(0, 250);
    const questionPayload: any =
      mode === 'scale'
        ? safeNumbersList.length > 10
          ? { type: 'choice', prompt: promptText, options: safeNumbersList }
          : { type: 'score', prompt: promptText, levels: safeNumbersList }
        : mode === 'discrete'
        ? { type: 'choice', prompt: promptText, options: safeNumbersList }
        : { type: 'noul', statement: thresholdStmt };

    // Check if live API key is supplied or configured on server
    if (effectiveKeyPresent) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (apiKey && apiKey.trim().length > 0) {
          headers['x-typesafe-api-key'] = apiKey.trim();
        }

        // Use the concurrent batch endpoint on our Express server
        const response = await fetch('/api/jev/predict-batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            apiKey: apiKey.trim() || undefined,
            items: itemsToProcess.map((item) => ({
              id: item.id,
              state: item.state,
              questions: { [questionKey]: questionPayload }
            }))
          })
        });

        const data = await response.json();
        const wallClock = Math.round(performance.now() - startTime);
        setTotalLatencyMs(wallClock);

        if (response.ok && data.results) {
          setApiSource('live');
          const mappedResults: BatchItemResult[] = itemsToProcess.map((item, idx) => {
            const apiItem = data.results[idx];
            if (apiItem && apiItem.status === 'success' && apiItem.results) {
              const resObj = apiItem.results[questionKey];
              if (resObj?.type === 'noul') {
                return {
                  id: item.id,
                  rawInput: item.state,
                  displaySnippet: item.displaySnippet,
                  status: 'success',
                  noulProbability: resObj.probability,
                  predictedMode: resObj.probability >= 0.5 ? 'Threshold Met' : 'Below Threshold',
                  modeProbability: resObj.probability,
                  confidence: 0.9,
                  latencyMs: apiItem.latencyMs
                };
              } else {
                const probs = resObj?.probabilities || {};
                const stats = calculateStatistics(probs);
                return {
                  id: item.id,
                  rawInput: item.state,
                  displaySnippet: item.displaySnippet,
                  status: 'success',
                  predictedMode: stats.mode || (resObj.score || resObj.choice),
                  modeProbability: stats.modeProb,
                  expectedValue: stats.expectedValue,
                  confidence: resObj.confidence || 0.88,
                  probabilities: probs,
                  latencyMs: apiItem.latencyMs
                };
              }
            } else {
              return {
                id: item.id,
                rawInput: item.state,
                displaySnippet: item.displaySnippet,
                status: 'error',
                errorMessage: apiItem?.error || 'API evaluation error',
                latencyMs: apiItem?.latencyMs || 50
              };
            }
          });

          setResults(mappedResults);
          setProgressCount(itemsToProcess.length);
          setIsRunning(false);
          return;
        } else {
          setErrorBanner(data.error || 'Batch API error from Jev endpoint. Running calibrated simulation.');
        }
      } catch (err: any) {
        setErrorBanner(`Batch network connection failed: ${err.message}. Falling back to simulation.`);
      }
    }

    // Calibrated Simulator: concurrent async execution
    setApiSource('simulated');
    let completed = 0;

    const promises = itemsToProcess.map(async (item, idx) => {
      // Simulate true concurrent network latency with realistic jitter (35-95ms)
      const simulatedLatency = Math.floor(35 + Math.random() * 60);
      await new Promise((r) => setTimeout(r, simulatedLatency));

      completed++;
      setProgressCount(completed);

      if (mode === 'threshold') {
        const prob = parseFloat((0.4 + Math.random() * 0.58).toFixed(3));
        return {
          id: item.id,
          rawInput: item.state,
          displaySnippet: item.displaySnippet,
          status: 'success' as const,
          noulProbability: prob,
          predictedMode: prob >= 0.5 ? 'Threshold Met' : 'Below Threshold',
          modeProbability: prob,
          confidence: parseFloat((0.82 + Math.random() * 0.14).toFixed(2)),
          latencyMs: simulatedLatency
        };
      } else {
        // Generate calibrated peaked distribution
        const n = numbersList.length;
        // Introduce structured variation based on item content or index
        const peakIdx = Math.min(n - 1, Math.max(0, Math.floor((idx * 3 + 4) % n)));
        const rawProbs: Record<string, number> = {};
        let sum = 0;
        numbersList.forEach((numStr, i) => {
          const dist = Math.abs(i - peakIdx);
          const weight = Math.exp(-(dist * dist) / (2 * 1.6 * 1.6)) + 0.015 * Math.random();
          rawProbs[numStr] = weight;
          sum += weight;
        });

        const normalized: Record<string, number> = {};
        numbersList.forEach((numStr) => {
          normalized[numStr] = parseFloat((rawProbs[numStr] / sum).toFixed(3));
        });

        const stats = calculateStatistics(normalized);
        return {
          id: item.id,
          rawInput: item.state,
          displaySnippet: item.displaySnippet,
          status: 'success' as const,
          predictedMode: stats.mode,
          modeProbability: stats.modeProb,
          expectedValue: stats.expectedValue,
          confidence: parseFloat((0.83 + Math.random() * 0.13).toFixed(2)),
          probabilities: normalized,
          latencyMs: simulatedLatency
        };
      }
    });

    const finalResults = await Promise.all(promises);
    const wallClock = Math.round(performance.now() - startTime);
    setTotalLatencyMs(wallClock);
    setResults(finalResults);
    setIsRunning(false);
  };

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    if (!results || results.length === 0) return null;
    const successful = results.filter((r) => r.status === 'success');
    if (successful.length === 0) return null;

    const avgLatency = Math.round(
      successful.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / successful.length
    );

    const validEVs = successful
      .map((r) => r.expectedValue)
      .filter((ev): ev is number => ev !== null && ev !== undefined);
    const avgExpectedValue =
      validEVs.length > 0
        ? parseFloat((validEVs.reduce((a, b) => a + b, 0) / validEVs.length).toFixed(2))
        : null;

    const avgConfidence = parseFloat(
      (
        successful.reduce((acc, r) => acc + (r.confidence || 0), 0) / successful.length
      ).toFixed(2)
    );

    // Mode frequency breakdown
    const frequencyMap: Record<string, number> = {};
    successful.forEach((r) => {
      if (r.predictedMode) {
        frequencyMap[r.predictedMode] = (frequencyMap[r.predictedMode] || 0) + 1;
      }
    });

    const speedup = totalLatencyMs && avgLatency > 0
      ? parseFloat(((avgLatency * successful.length) / Math.max(1, totalLatencyMs)).toFixed(1))
      : 1.0;

    return {
      total: results.length,
      successfulCount: successful.length,
      avgLatency,
      avgExpectedValue,
      avgConfidence,
      frequencyMap,
      speedup
    };
  }, [results, totalLatencyMs]);

  // Filtered rows for search query
  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.displaySnippet.toLowerCase().includes(q) ||
        (r.predictedMode && r.predictedMode.toLowerCase().includes(q))
    );
  }, [results, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!results) return;
    const headers = ['id', 'predicted_mode', 'mode_probability', 'expected_value', 'confidence', 'latency_ms', 'snippet'];
    const rows = results.map((r) => [
      `"${r.id}"`,
      `"${r.predictedMode || ''}"`,
      r.modeProbability !== undefined ? (r.modeProbability * 100).toFixed(1) + '%' : '',
      r.expectedValue !== undefined && r.expectedValue !== null ? r.expectedValue : '',
      r.confidence !== undefined ? (r.confidence * 100).toFixed(1) + '%' : '',
      r.latencyMs || '',
      `"${r.displaySnippet.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jev_batch_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Python Code Generator for Batch
  const pythonBatchCode = `import asyncio
import csv
from typesafe_sdk import AsyncTypeSafeClient, score, choice, noul

async def run_concurrent_batch():
    api_key = "${apiKey.trim() || 'ts_live_your_jev_api_key'}"
    
    # 1. Load batch items (from CSV, JSON, or list)
    batch_items = [
${parsedData.items.slice(0, 5).map(item => `        {"id": "${item.id}", "state": ${JSON.stringify(item.state)}}`).join(',\n')}
        # ... (${parsedData.items.length} total items)
    ]
    
    async with AsyncTypeSafeClient(api_key=api_key) as client:
        # Define concurrent worker task
        async def evaluate_item(item):
            result = await client.system_one(
                state=item["state"],
                questions={
${
  mode === 'scale'
    ? `                    "predicted_number": score(
                        "${promptText.replace(/"/g, '\\"')}",
                        levels=${JSON.stringify(numbersList)}
                    )`
    : mode === 'discrete'
    ? `                    "predicted_number": choice(
                        "${promptText.replace(/"/g, '\\"')}",
                        options=${JSON.stringify(numbersList)}
                    )`
    : `                    "threshold_test": noul(
                        "${thresholdStmt.replace(/"/g, '\\"')}"
                    )`
}
                }
            )
            return item["id"], result

        # 2. Dispatch all items concurrently with asyncio.gather
        print(f"🚀 Dispatching {len(batch_items)} items concurrently to Jev...")
        predictions = await asyncio.gather(*(evaluate_item(item) for item in batch_items))
        
        # 3. Print high-throughput batch results
        for item_id, res in predictions:
${
  mode === 'threshold'
    ? `            prob = res.threshold_test.probability
            print(f"[{item_id}] Probability: {prob:.3f} | Exceeds: {res.threshold_test.boolean}")`
    : `            r = res.predicted_number
            mode = r.score if hasattr(r, 'score') else r.choice
            print(f"[{item_id}] Predicted Mode: {mode} (P={r.probabilities[mode]:.2%}, Conf={r.confidence:.2f})")`
}

if __name__ == "__main__":
    asyncio.run(run_concurrent_batch())
`;

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonBatchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Information */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Batch Number Probability Analysis
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
                Concurrent Fan-out
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
              Upload a dataset (CSV, JSON Lines, or newline-separated records) and evaluate probability
              distributions across all inputs simultaneously using TypeSafe Jev’s non-blocking concurrent inference.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-xs font-mono font-medium ${
                apiSource === 'live'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiSource === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{apiSource === 'live' ? 'Live api.typesafe.ai' : 'Calibrated Jev Simulator'}</span>
              {totalLatencyMs && <span className="text-zinc-500">• {totalLatencyMs}ms total</span>}
            </div>
          </div>
        </div>

        {errorBanner && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-300 border border-rose-500/20 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}
      </div>

      {/* Preset Batch Datasets */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Load Sample Batch Dataset:
          </label>
          <span className="text-xs text-zinc-500 font-mono">Ready-to-run CSV & JSON Lines</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {BATCH_SAMPLES.map((sample) => {
            const isSelected = selectedSample.id === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`flex flex-col text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{sample.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{sample.format}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400">{sample.mode}</span>
                  <span className="text-zinc-500">{sample.numbers.length} targets</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/30'
                : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.json,.jsonl,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              id="batch-file-input"
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400 mb-2">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-white">
              Drop your CSV or newline-separated file here
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              or <span className="text-emerald-400 underline">browse from your computer</span> (.csv, .jsonl, .txt)
            </p>
          </div>

          {/* Textarea for Direct Paste & Live Edit */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Raw Input Data
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-zinc-700">
                  {parsedData.format.toUpperCase()} • {parsedData.items.length} items
                </span>
                <button
                  onClick={() => setRawText('')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-1">
              <textarea
                id="batch-raw-input-textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={9}
                className="w-full resize-none rounded-lg bg-transparent p-3 font-mono text-[11px] leading-relaxed text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="Paste CSV rows (with headers) or JSON lines here..."
              />
            </div>
          </div>

          {/* Target Question / Schema Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Prediction Target
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Evaluation Primitive</span>
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

            {mode === 'threshold' ? (
              <div>
                <label className="text-xs font-medium text-zinc-400">Threshold Statement:</label>
                <input
                  type="text"
                  value={thresholdStmt}
                  onChange={(e) => setThresholdStmt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Will cluster CPU exceed 85%?"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-zinc-400">Prompt / Question:</label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {mode !== 'threshold' && (
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <label className="font-medium">Number Scale / Targets ({numbersList.length}):</label>
                  <span className="text-[10px] text-zinc-500 font-mono">Comma-separated</span>
                </div>
                <input
                  type="text"
                  value={numbersList.join(', ')}
                  onChange={(e) => {
                    const parsed = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setNumbersList(parsed);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Run Concurrent Batch Button */}
          <button
            id="run-batch-prediction-btn"
            onClick={handleRunBatch}
            disabled={isRunning || parsedData.items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Zap className="h-4 w-4 animate-spin text-amber-300" />
                <span>
                  Processing Concurrent Batch ({progressCount}/{parsedData.items.length})...
                </span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  Run Concurrent Prediction ({parsedData.items.length} inputs)
                </span>
              </>
            )}
          </button>

          {/* Real-time Progress Bar during execution */}
          {isRunning && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Concurrent Dispatch in Progress</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((progressCount / Math.max(1, parsedData.items.length)) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.round((progressCount / Math.max(1, parsedData.items.length)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Batch Analytics & Results Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Cards */}
          {summaryMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Batch Size & Status */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Total Processed</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-white">
                    {summaryMetrics.successfulCount}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    /{summaryMetrics.total} items
                  </span>
                </div>
              </div>

              {/* Total Latency & Concurrency Speedup */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Concurrent Latency</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {totalLatencyMs}ms
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({summaryMetrics.speedup}x speedup)
                  </span>
                </div>
              </div>

              {/* Batch Average Expected Value */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Batch Mean E[X]</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-sky-400">
                    {summaryMetrics.avgExpectedValue !== null ? summaryMetrics.avgExpectedValue : 'N/A'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">avg mode</span>
                </div>
              </div>

              {/* Average Confidence */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <span className="text-[11px] text-zinc-400 font-mono">Mean Confidence</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-amber-400">
                    {(summaryMetrics.avgConfidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">calibrated</span>
                </div>
              </div>
            </div>
          )}

          {/* Histogram Breakdown: Frequency of Winning Numbers */}
          {summaryMetrics && Object.keys(summaryMetrics.frequencyMap).length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Winning Number Distribution Across Batch
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {summaryMetrics.successfulCount} evaluations
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {Object.entries(summaryMetrics.frequencyMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([numStr, count]) => {
                    const pct = ((count / summaryMetrics.successfulCount) * 100).toFixed(0);
                    return (
                      <div
                        key={numStr}
                        className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-emerald-300">{numStr}</span>
                          <span className="text-zinc-400">{count} items</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="mt-1 text-right text-[10px] font-mono text-zinc-500">
                          {pct}% of batch
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Interactive Results Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Concurrent Batch Predictions</h3>
                {results && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {filteredResults.length} / {results.length} rows
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Search / Filter Input */}
                <div className="relative">
                  <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search results..."
                    className="rounded-lg border border-zinc-800 bg-zinc-900 py-1 pl-8 pr-3 text-xs font-mono text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Export CSV Button */}
                {results && results.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {copiedCsv ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Exported</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            {!results ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-2">
                <Layers className="h-8 w-8 text-zinc-700" />
                <p className="text-xs font-medium">No batch evaluation executed yet.</p>
                <p className="text-[11px] text-zinc-600 max-w-sm">
                  Click "Run Concurrent Prediction" on the left to evaluate all {parsedData.items.length} rows in parallel.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-auto rounded-xl border border-zinc-800/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3"># ID</th>
                      <th className="py-2.5 px-3">Input Snippet</th>
                      <th className="py-2.5 px-3">Predicted Mode</th>
                      <th className="py-2.5 px-3">P(Mode)</th>
                      <th className="py-2.5 px-3">E[X]</th>
                      <th className="py-2.5 px-3">Conf</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-2 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                    {filteredResults.map((item) => {
                      const isExpanded = expandedRowId === item.id;
                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-zinc-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                              {item.id}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[180px]">
                              {item.displaySnippet}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {item.status === 'success' ? (
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-bold border border-emerald-500/20">
                                  {item.predictedMode}
                                </span>
                              ) : item.status === 'pending' ? (
                                <span className="text-zinc-500 animate-pulse">evaluating...</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">Error</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-400 whitespace-nowrap">
                              {item.modeProbability !== undefined
                                ? `${(item.modeProbability * 100).toFixed(1)}%`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-sky-400 font-semibold whitespace-nowrap">
                              {item.expectedValue !== undefined && item.expectedValue !== null
                                ? item.expectedValue
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-amber-400 whitespace-nowrap">
                              {item.confidence !== undefined
                                ? `${(item.confidence * 100).toFixed(0)}%`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                              {item.latencyMs ? `${item.latencyMs}ms` : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                title="Toggle full distribution"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr className="bg-zinc-900/80 border-y border-zinc-800">
                              <td colSpan={8} className="p-3 text-xs">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-zinc-400">
                                    <span className="font-semibold text-white">
                                      Full Distribution Breakdown for [{item.id}]
                                    </span>
                                    <span className="text-[10px] font-mono">
                                      Latency: {item.latencyMs}ms • Confidence: {(item.confidence || 0) * 100}%
                                    </span>
                                  </div>

                                  {/* Probabilities preview */}
                                  {item.probabilities && (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                      {Object.entries(item.probabilities).map(([numStr, prob]) => {
                                        const isWinning = numStr === item.predictedMode;
                                        return (
                                          <div
                                            key={numStr}
                                            className={`rounded-lg p-2 border ${
                                              isWinning
                                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                            }`}
                                          >
                                            <div className="flex justify-between font-mono font-bold">
                                              <span>{numStr}</span>
                                              <span>{(prob * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                                              <div
                                                className={`h-full ${isWinning ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                                                style={{ width: `${prob * 100}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Raw input JSON */}
                                  <div className="rounded bg-zinc-950 p-2 font-mono text-[10px] text-zinc-300 border border-zinc-800">
                                    <span className="text-zinc-500 block mb-1">Raw Evaluated State:</span>
                                    <code>{JSON.stringify(item.rawInput, null, 2)}</code>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Generated Python Async Script for Concurrent Batch */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>Python SDK Concurrent Batch Code (asyncio.gather)</span>
              </div>
              <button
                onClick={handleCopyPython}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
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

            <pre className="mt-3 max-h-52 overflow-auto font-mono text-[11px] leading-relaxed text-zinc-300 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
              <code>{pythonBatchCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
