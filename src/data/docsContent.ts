export interface DocSection {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: string;
  codeSnippet?: {
    language: string;
    title: string;
    code: string;
  };
}

export const DOCS_SECTIONS: DocSection[] = [
  {
    id: 'async',
    title: 'Async Client (AsyncTypeSafeClient)',
    badge: 'Primary Reference #async',
    summary: 'The asynchronous client is designed for non-blocking I/O, event loops, microservices, and concurrent batch evaluation.',
    content: `When building high-throughput web APIs (FastAPI, Starlette), event pipelines (Kafka, Celery), or evaluating large datasets, using the synchronous client can block your worker threads. 

The \`AsyncTypeSafeClient\` enables full concurrency via Python's standard \`asyncio\` event loop, allowing thousands of evaluations per second across single worker processes with minimal memory footprint.

Key Advantages:
• Non-blocking I/O: Keep your FastAPI or Tornado workers responsive during network requests.
• Massive Concurrency: Fan out hundreds of evaluations simultaneously using \`asyncio.gather\` with connection pooling.
• HTTP/2 Multiplexing: Reuse underlying persistent connections for lower TCP handshake latency.
• Built-in Exponential Backoff: Seamless automatic retries on rate limits (HTTP 429) and transient server errors (HTTP 408, 5xx).`,
    codeSnippet: {
      language: 'python',
      title: 'basic_async_usage.py',
      code: `import asyncio
from typesafe_sdk import AsyncTypeSafeClient, choice, score, noul

async def main():
    # Recommended: use async with context manager for automatic cleanup
    async with AsyncTypeSafeClient(api_key="ts_live_...") as client:
        result = await client.system_one(
            state="User reports: Billing credit not applied to invoice #8841",
            questions={
                "department": choice(
                    "Assign to team", 
                    options=["billing", "technical", "sales", "general"]
                ),
                "urgency": score(
                    "Customer urgency", 
                    levels=["low", "medium", "high", "critical"]
                ),
                "needs_escalation": noul(
                    "Does this customer require senior management escalation?"
                )
            }
        )

        # Strongly typed property access without manual JSON parsing
        print(f"Assigned: {result.department.choice} (conf: {result.department.confidence:.2f})")
        print(f"Urgency level: {result.urgency.score}")
        print(f"Escalation needed: {result.needs_escalation.boolean} (p={result.needs_escalation.probability:.3f})")

if __name__ == "__main__":
    asyncio.run(main())`
    }
  },
  {
    id: 'installation',
    title: 'Installation & Requirements',
    badge: 'Setup',
    summary: 'System requirements, package installation via pip or uv, and API key environment configuration.',
    content: `The TypeSafe Python SDK requires **Python 3.10** or higher. It relies on standard modern async libraries (\`httpx\` and \`pydantic\`) and has no heavy binary dependencies.

Install with your preferred package manager:
• **pip**: \`pip install typesafe-sdk\`
• **uv**: \`uv add typesafe-sdk\`
• **poetry**: \`poetry add typesafe-sdk\`

Configuration:
Export your API key generated from the TypeSafe AI developer console:
\`\`\`bash
export TYPESAFE_API_KEY="ts_live_your_api_key_here"
\`\`\`
If \`TYPESAFE_API_KEY\` is set in your environment, \`AsyncTypeSafeClient()\` automatically picks it up without requiring explicit parameters.`,
    codeSnippet: {
      language: 'bash',
      title: 'terminal',
      code: `# Install using pip or uv
pip install typesafe-sdk

# Or with uv (recommended for speed)
uv add typesafe-sdk

# Set environment variable
export TYPESAFE_API_KEY="ts_live_9a8b7c6d5e4f3a2b1c"`
    }
  },
  {
    id: 'primitives',
    title: 'Prediction Primitives (Choice, Score, Noul)',
    badge: 'Core Engine',
    summary: 'TypeSafe models output strictly typed primitives instead of unstructured text, eliminating JSON repair.',
    content: `Unlike generative LLMs that generate free-form strings which require regex or fragile JSON parsing, TypeSafe's Jev model produces calibrated probability distributions over discrete mathematical primitives:

1. **Choice (options: list[str])**:
   Selects from 2 to 255 discrete options. Returns the chosen label, the calibrated probability for each option, and an entropy-based confidence score.
   
2. **Score (levels: list[str])**:
   Evaluates the state on an ordered scalar rubric (2 to 10 levels). Returns the winning level, probability across all levels, and confidence.
   
3. **Noul (statement: str)**:
   Predicts the scalar probability (0.0 to 1.0) that the given proposition is true regarding the state. Returns \`.probability\` and \`.boolean\` (thresholded at >= 0.5 or custom threshold).`,
    codeSnippet: {
      language: 'python',
      title: 'primitives_example.py',
      code: `from typesafe_sdk import choice, score, noul

# 1. Choice: Discrete classification (up to 255 options)
q_choice = choice(
    prompt="Which tier should handle this incident?",
    options=["tier-1-helpdesk", "tier-2-sysadmin", "tier-3-devops", "secops"]
)

# 2. Score: Ordered rubric (2 to 10 levels)
q_score = score(
    prompt="Assess the financial risk of this transaction",
    levels=["nominal", "minor", "moderate", "substantial", "catastrophic"]
)

# 3. Noul: Probability of truth for a statement (0.0 - 1.0)
q_noul = noul(
    statement="The client has expressed intent to cancel their subscription."
)`
    }
  },
  {
    id: 'batch-fanout',
    title: 'Concurrent Batch Fan-out (asyncio.gather)',
    badge: 'High Performance',
    summary: 'Evaluate large datasets concurrently with rate-limiting semaphores and non-blocking batch execution.',
    content: `To process hundreds or thousands of records without overwhelming system resources or exceeding rate limits, use an \`asyncio.Semaphore\` combined with \`asyncio.gather\`.

This pattern maintains a constant pool of in-flight requests, giving you predictable sub-second throughput for bulk ticket triage, content moderation pipelines, or batch evaluations.`,
    codeSnippet: {
      language: 'python',
      title: 'concurrent_batch.py',
      code: `import asyncio
from typing import Any
from typesafe_sdk import AsyncTypeSafeClient, choice, score

async def evaluate_single(
    client: AsyncTypeSafeClient, 
    item: dict[str, Any], 
    semaphore: asyncio.Semaphore
):
    async with semaphore:  # Caps concurrent in-flight HTTP requests
        return await client.system_one(
            state=item,
            questions={
                "risk": score("Risk rating", levels=["low", "medium", "high"]),
                "action": choice("Action", options=["approve", "flag", "reject"])
            }
        )

async def evaluate_batch(items: list[dict[str, Any]], max_concurrency: int = 25):
    semaphore = asyncio.Semaphore(max_concurrency)
    async with AsyncTypeSafeClient() as client:
        tasks = [evaluate_single(client, item, semaphore) for item in items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results`
    }
  },
  {
    id: 'retries-errors',
    title: 'Error Handling & Automatic Retries',
    badge: 'Production Resilience',
    summary: 'Built-in resilience handling, HTTP 429 rate limit backoff, and exception hierarchies.',
    content: `The TypeSafe Python SDK comes with enterprise-grade connection management out of the box:

• **Automatic Retries**: Retries failed requests up to 3 times with exponential jittered backoff on HTTP 408 (Request Timeout), 429 (Too Many Requests), 500, 502, 503, and 504.
• **Exception Hierarchy**:
  - \`TypeSafeError\`: Base exception for all SDK errors.
  - \`TypeSafeRateLimitError\`: Raised if rate limits remain exceeded after retries. Includes \`retry_after\` headers.
  - \`TypeSafeAuthenticationError\`: Raised on invalid or expired API keys (HTTP 401/403).
  - \`TypeSafeValidationError\`: Raised when state exceeds 64KB or questions exceed maximum option limits.
  - \`TypeSafeTimeoutError\`: Raised if request exceeds configured timeout.`,
    codeSnippet: {
      language: 'python',
      title: 'resilient_error_handling.py',
      code: `import asyncio
from typesafe_sdk import AsyncTypeSafeClient, choice
from typesafe_sdk.exceptions import (
    TypeSafeRateLimitError, 
    TypeSafeAuthenticationError, 
    TypeSafeTimeoutError
)

async def safe_execute():
    async with AsyncTypeSafeClient(
        timeout=10.0,    # Total timeout in seconds
        max_retries=3    # Automatic retry attempts
    ) as client:
        try:
            result = await client.system_one(
                state={"user_message": "Can I get a refund for transaction #499?"},
                questions={"intent": choice("Customer intent", options=["refund", "feedback", "help"])}
            )
            return result
        except TypeSafeRateLimitError as e:
            print(f"Rate limit exceeded. Retry suggested after {e.retry_after}s")
        except TypeSafeTimeoutError:
            print("Request timed out after 10s. Downstream fallback triggered.")
        except TypeSafeAuthenticationError:
            print("Invalid TYPESAFE_API_KEY. Please verify developer credentials.")`
    }
  },
  {
    id: 'fastapi-integration',
    title: 'FastAPI Production Integration',
    badge: 'Frameworks',
    summary: 'Proper lifecycle hooks (lifespan) to share a singleton client instance across all HTTP routes.',
    content: `When integrating with FastAPI, do **not** instantiate a new \`AsyncTypeSafeClient\` inside every route handler. Creating new clients creates new HTTP connection pools.

Instead, initialize the client once in the application's \`lifespan\` context manager and store it on \`app.state.typesafe\`. This maintains connection pooling across thousands of incoming web requests.`,
    codeSnippet: {
      language: 'python',
      title: 'fastapi_lifespan_example.py',
      code: `from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typesafe_sdk import AsyncTypeSafeClient, choice, score, noul

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize shared async client during server startup
    client = AsyncTypeSafeClient()
    app.state.typesafe = client
    yield
    # Gracefully shut down HTTP/2 connections on server stop
    await client.close()

app = FastAPI(lifespan=lifespan)

class TicketPayload(BaseModel):
    ticket_id: str
    message: str

@app.post("/triage")
async def triage_ticket(payload: TicketPayload, request: Request):
    client: AsyncTypeSafeClient = request.app.state.typesafe
    
    result = await client.system_one(
        state=payload.model_dump(),
        questions={
            "queue": choice("Target queue", options=["engineering", "billing", "tier1"]),
            "urgency": score("Urgency score", levels=["low", "standard", "urgent", "critical"])
        }
    )
    
    return {
        "ticket_id": payload.ticket_id,
        "assigned_queue": result.queue.choice,
        "urgency_level": result.urgency.score,
        "confidence": result.queue.confidence
    }`
    }
  }
];
