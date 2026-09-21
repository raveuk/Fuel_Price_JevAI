import React, { useState, useEffect } from 'react';
import { Activity, Play, RefreshCw, Zap, Clock, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

interface TaskItem {
  id: number;
  syncStart: number;
  syncEnd: number;
  asyncStart: number;
  asyncEnd: number;
  status: 'idle' | 'running' | 'completed';
}

export const ConcurrencySimulator: React.FC = () => {
  const [batchSize, setBatchSize] = useState<number>(25);
  const [concurrencyLimit, setConcurrencyLimit] = useState<number>(10);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [syncTime, setSyncTime] = useState<number | null>(null);
  const [asyncTime, setAsyncTime] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Initialize task items
  useEffect(() => {
    const newTasks: TaskItem[] = [];
    for (let i = 0; i < batchSize; i++) {
      newTasks.push({
        id: i + 1,
        syncStart: 0,
        syncEnd: 0,
        asyncStart: 0,
        asyncEnd: 0,
        status: 'idle'
      });
    }
    setTasks(newTasks);
    setSyncTime(null);
    setAsyncTime(null);
    setProgress(0);
  }, [batchSize]);

  const runSimulation = () => {
    setIsRunning(true);
    setProgress(0);

    // Calculate theoretical and simulated timings based on realistic System One latency (~35ms per request)
    const baseLatency = 35; // ms
    const jitter = () => Math.floor(Math.random() * 20) - 10;

    // Synchronous total: batchSize * baseLatency
    const estimatedSyncTotal = batchSize * (baseLatency + 5);

    // Asynchronous total with concurrencyLimit: Math.ceil(batchSize / concurrencyLimit) * baseLatency
    const waves = Math.ceil(batchSize / concurrencyLimit);
    const estimatedAsyncTotal = waves * baseLatency + 25; // small overhead for event loop

    setSyncTime(estimatedSyncTotal);
    setAsyncTime(estimatedAsyncTotal);

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      if (current >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        setProgress(100);
      } else {
        setProgress(current);
      }
    }, 40);
  };

  const speedup = syncTime && asyncTime ? (syncTime / asyncTime).toFixed(1) : '18.5';
  const syncReqPerSec = syncTime ? ((batchSize / syncTime) * 1000).toFixed(1) : '24.2';
  const asyncReqPerSec = asyncTime ? ((batchSize / asyncTime) * 1000).toFixed(1) : '442.8';

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Performance Benchmark
              </span>
              <span className="text-xs text-zinc-500 font-mono">docs.typesafe.ai/sdk/python#async</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
              Why Async Matters: Concurrency & Throughput
            </h2>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
              TypeSafe AI's Jev model returns answers in tens of milliseconds. But in synchronous Python,
              worker threads stall waiting on I/O. With <code className="text-emerald-400 font-mono">AsyncTypeSafeClient</code> and{' '}
              <code className="text-emerald-400 font-mono">asyncio.gather</code>, you achieve massive request fan-out without thread bloat.
            </p>
          </div>

          <button
            id="run-benchmark-btn"
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Simulating Gathering...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run Fan-out Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Sliders */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/80">
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Batch Size (Total Items)</span>
              <span className="font-mono text-emerald-400 font-bold">{batchSize} items</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={batchSize}
              disabled={isRunning}
              onChange={e => setBatchSize(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>5 items (micro)</span>
              <span>50 items (standard)</span>
              <span>100 items (heavy batch)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Max Concurrency Limit (Semaphore)</span>
              <span className="font-mono text-emerald-400 font-bold">{concurrencyLimit} concurrent</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={concurrencyLimit}
              disabled={isRunning}
              onChange={e => setConcurrencyLimit(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
              <span>1 (sequential)</span>
              <span>10 (standard worker)</span>
              <span>50 (high fan-out)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Synchronous TypeSafeClient */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-400" />
              <h3 className="font-semibold text-white text-sm">Synchronous: TypeSafeClient</h3>
            </div>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
              Sequential (1 by 1)
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs text-zinc-400">Total Wall-Clock Time:</span>
            <span className="font-mono text-xl font-bold text-rose-300">
              {syncTime ? `${(syncTime / 1000).toFixed(2)}s` : `${((batchSize * 40) / 1000).toFixed(2)}s`}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Throughput:</span>
              <span className="text-zinc-200">~{syncReqPerSec} req/sec</span>
            </div>
            <div className="flex justify-between">
              <span>Thread State:</span>
              <span className="text-rose-400">Blocked on socket I/O</span>
            </div>
            <div className="flex justify-between">
              <span>Resource usage:</span>
              <span className="text-zinc-300">High thread idle time</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400 border border-zinc-800/80">
            <p className="text-zinc-500"># Blocks the Python GIL / worker thread</p>
            <p>results = [client.system_one(...) for item in batch]</p>
          </div>
        </div>

        {/* Asynchronous AsyncTypeSafeClient */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-900/90 p-5 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Asynchronous: AsyncTypeSafeClient</h3>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
              {speedup}x Faster
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs text-zinc-400">Total Wall-Clock Time:</span>
            <span className="font-mono text-xl font-bold text-emerald-400">
              {asyncTime ? `${(asyncTime / 1000).toFixed(2)}s` : `${((Math.ceil(batchSize / concurrencyLimit) * 35 + 25) / 1000).toFixed(2)}s`}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Throughput:</span>
              <span className="text-emerald-400 font-bold">~{asyncReqPerSec} req/sec</span>
            </div>
            <div className="flex justify-between">
              <span>Event Loop State:</span>
              <span className="text-emerald-400">Non-blocking, cooperative</span>
            </div>
            <div className="flex justify-between">
              <span>HTTP/2 Multiplexing:</span>
              <span className="text-emerald-400">Enabled (Connection pool)</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400 border border-zinc-800/80">
            <p className="text-zinc-500"># Non-blocking concurrent gather</p>
            <p className="text-emerald-300">tasks = [client.system_one(...) for item in batch]</p>
            <p className="text-emerald-300">results = await asyncio.gather(*tasks)</p>
          </div>
        </div>
      </div>

      {/* Visual Concurrency Waterfall / Heatmap */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Concurrent Request Pool Waterfall</h3>
          <span className="text-xs text-zinc-400 font-mono">
            {batchSize} items across {Math.ceil(batchSize / concurrencyLimit)} wave(s)
          </span>
        </div>

        {/* Task matrix */}
        <div className="mt-4 grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from({ length: batchSize }).map((_, idx) => {
            const wave = Math.floor(idx / concurrencyLimit);
            const isFinished = progress === 100 || (!isRunning && syncTime !== null);
            const isInFlight = isRunning && progress > wave * 25 && progress < (wave + 1) * 25;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center rounded-lg p-2 font-mono text-xs border transition-all duration-300 ${
                  isFinished
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isInFlight
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}
              >
                <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                <span className="text-[11px] font-bold mt-0.5">
                  {isFinished ? '200 OK' : isInFlight ? 'eval' : 'idle'}
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5">~32ms</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
