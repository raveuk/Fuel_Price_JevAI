import React, { useState } from 'react';
import { Question, CodeSnippetStyle } from '../types';
import { Copy, Check, Download, FileCode, Play, Terminal } from 'lucide-react';

interface PythonCodeGeneratorProps {
  state: string;
  questions: Question[];
}

export const PythonCodeGenerator: React.FC<PythonCodeGeneratorProps> = ({ state, questions }) => {
  const [style, setStyle] = useState<CodeSnippetStyle>('script');
  const [copied, setCopied] = useState(false);

  // Format questions dictionary for Python
  const renderQuestionsDict = (indent: string = '        ') => {
    return questions
      .map(q => {
        if (q.type === 'choice') {
          const optsStr = JSON.stringify(q.options);
          return `${indent}"${q.name}": choice("${q.prompt.replace(/"/g, '\\"')}", options=${optsStr}),`;
        } else if (q.type === 'score') {
          const levelsStr = JSON.stringify(q.levels);
          return `${indent}"${q.name}": score("${q.prompt.replace(/"/g, '\\"')}", levels=${levelsStr}),`;
        } else {
          return `${indent}"${q.name}": noul("${q.statement.replace(/"/g, '\\"')}"),`;
        }
      })
      .join('\n');
  };

  // Generate code based on style
  const generateCode = (): string => {
    let parsedState: any = state;
    try {
      parsedState = JSON.parse(state);
    } catch {
      // keep as string
    }

    const stateRepr =
      typeof parsedState === 'string'
        ? `"""${parsedState.replace(/"""/g, '\\"\\"\\"')}"""`
        : JSON.stringify(parsedState, null, 4);

    if (style === 'script') {
      return `import asyncio
import os
from typesafe_sdk import AsyncTypeSafeClient, choice, score, noul

async def main():
    # Recommended: use async context manager for automated connection cleanup
    # Set TYPESAFE_API_KEY environment variable, or pass api_key directly
    async with AsyncTypeSafeClient(api_key=os.getenv("TYPESAFE_API_KEY", "ts_live_your_key_here")) as client:
        # System One fast non-blocking evaluation
        result = await client.system_one(
            state=${stateRepr},
            questions={
${renderQuestionsDict('                ')}
            }
        )

        # Strongly-typed output access (no JSON parsing or regex required)
${questions
  .map(q => {
    if (q.type === 'choice') {
      return `        print(f"[Choice] ${q.name}: {result.${q.name}.choice} (confidence={result.${q.name}.confidence:.2f})")`;
    } else if (q.type === 'score') {
      return `        print(f"[Score] ${q.name}: {result.${q.name}.score} (confidence={result.${q.name}.confidence:.2f})")`;
    } else {
      return `        print(f"[Noul] ${q.name}: boolean={result.${q.name}.boolean} (prob={result.${q.name}.probability:.3f})")`;
    }
  })
  .join('\n')}

if __name__ == "__main__":
    asyncio.run(main())
`;
    }

    if (style === 'fastapi') {
      return `from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typesafe_sdk import AsyncTypeSafeClient, choice, score, noul

# Singleton client lifecycle management across all HTTP requests
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize shared AsyncTypeSafeClient connection pool
    client = AsyncTypeSafeClient()
    app.state.typesafe_client = client
    yield
    # Gracefully close connections on server shutdown
    await client.close()

app = FastAPI(
    title="TypeSafe AI Async Service",
    description="High-throughput asynchronous System One inference",
    lifespan=lifespan
)

class EvaluationRequest(BaseModel):
    state: Dict[str, Any]

@app.post("/evaluate")
async def evaluate_endpoint(request: Request, body: EvaluationRequest):
    client: AsyncTypeSafeClient = request.app.state.typesafe_client
    
    try:
        result = await client.system_one(
            state=body.state,
            questions={
${renderQuestionsDict('                ')}
            }
        )
        
        return {
            "status": "success",
            "results": {
${questions
  .map(q => {
    if (q.type === 'choice') {
      return `                "${q.name}": {"choice": result.${q.name}.choice, "confidence": result.${q.name}.confidence},`;
    } else if (q.type === 'score') {
      return `                "${q.name}": {"score": result.${q.name}.score, "confidence": result.${q.name}.confidence},`;
    } else {
      return `                "${q.name}": {"boolean": result.${q.name}.boolean, "probability": result.${q.name}.probability},`;
    }
  })
  .join('\n')}
            }
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
`;
    }

    if (style === 'batch_worker') {
      return `import asyncio
import time
from typing import Any, List
from typesafe_sdk import AsyncTypeSafeClient, choice, score, noul

async def evaluate_single(
    client: AsyncTypeSafeClient, 
    item: Any, 
    semaphore: asyncio.Semaphore,
    index: int
):
    async with semaphore:  # Bound active concurrent in-flight requests
        t0 = time.perf_counter()
        result = await client.system_one(
            state=item,
            questions={
${renderQuestionsDict('                ')}
            }
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return {"index": index, "latency_ms": elapsed_ms, "result": result}

async def run_batch_fanout(items: List[Any], max_concurrency: int = 25):
    # Semaphore prevents flooding the endpoint and hitting hard rate limits
    semaphore = asyncio.Semaphore(max_concurrency)
    
    async with AsyncTypeSafeClient() as client:
        print(f"Submitting {len(items)} items with concurrency cap={max_concurrency}...")
        tasks = [
            evaluate_single(client, item, semaphore, i) 
            for i, item in enumerate(items)
        ]
        
        # Concurrently gather all responses
        start_time = time.perf_counter()
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.perf_counter() - start_time
        
        print(f"Done! Evaluated {len(responses)} items in {total_time:.2f}s ({len(responses)/total_time:.1f} req/sec)")
        return responses

if __name__ == "__main__":
    sample_dataset = [${stateRepr} for _ in range(20)]
    asyncio.run(run_batch_fanout(sample_dataset, max_concurrency=10))
`;
    }

    return '';
  };

  const code = generateCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      style === 'fastapi'
        ? 'main_fastapi.py'
        : style === 'batch_worker'
        ? 'batch_evaluator.py'
        : 'typesafe_async_example.py';
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3">
        <div className="flex items-center gap-1.5">
          <FileCode className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">Target Pattern:</span>
          <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => setStyle('script')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                style === 'script'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Standard Script
            </button>
            <button
              onClick={() => setStyle('fastapi')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                style === 'fastapi'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              FastAPI Service
            </button>
            <button
              onClick={() => setStyle('batch_worker')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                style === 'batch_worker'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Concurrent Batch Fan-out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white border border-zinc-700/60 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Code Display with line numbers */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-zinc-400">
              {style === 'fastapi'
                ? 'main_fastapi.py'
                : style === 'batch_worker'
                ? 'concurrent_batch.py'
                : 'async_typesafe.py'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">Python 3.10+ • typesafe-sdk</span>
        </div>

        <div className="max-h-[580px] overflow-auto p-4 leading-relaxed text-zinc-300">
          <pre className="selection:bg-emerald-900 selection:text-white">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
