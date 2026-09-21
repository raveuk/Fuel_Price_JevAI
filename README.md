# UK Fuel Price Intelligence & TypeSafe Jev™ AI Predictor

> A real-time UK forecourt fuel price comparison platform and probabilistic pump price rise forecasting engine powered by **TypeSafe's flagship System One model, Jev**.

---

## ⚡ Overview

This application delivers comprehensive UK retail and wholesale fuel intelligence across **Petrol** (Standard Unleaded E10 & Premium Super Unleaded E5) and **Diesel** (Standard B7 & Premium Diesel). Beyond real-time tracking across supermarkets, motorways, independent forecourts, and national benchmarks, it integrates **TypeSafe Jev** to evaluate wholesale commodity lags and predict the **timing, magnitude, and likelihood of upcoming fuel price rises**.

```
                           ┌───────────────────────────────┐
                           │      Wholesale Market Data    │
                           │  ARA Rotterdam Gasoil Barges  │
                           │     Brent Crude in GBP/USD    │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
┌─────────────────────────┐       ┌───────────────────────────────┐
│     UK Forecourts       │       │    TypeSafe Jev (System 1)    │
│ Supermarkets, Oil Majors│──────▶│   Typed States & Questions   │
│ CMA & DESNZ Benchmarks  │       │  Calibrated Probabilities (P) │
└─────────────────────────┘       └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │ Next Fuel Price Rise Forecast │
                                  │  • Timing Window (3–7 Days)   │
                                  │  • Magnitude (+1.8p to +3.1p) │
                                  │  • Projected Pump Price Tier  │
                                  │  • Tank Refill Cost Impact    │
                                  └───────────────────────────────┘
```

---

## 🧠 The Jev Model: First System One Architecture

### Why System One?
Large language models (LLMs) are engineered to produce text for human reading. When software requires an AI model to make discrete judgments or routing decisions, coercing a text-generation system into outputting JSON and parsing the result introduces latency, schema fragility, and uncalibrated probabilities.

**Jev** is TypeSafe's flagship model and the first **System One** model:
- **Direct Decisions**: Send typed market states and questions; receive structured answers your application code can consume directly.
- **No Text Generation, No Parsing**: Evaluates questions natively against state representations.
- **Calibrated Probabilities**: Choice and Score evaluations return probability distributions and confidence scores your code can branch on, sort by, or use to determine automated procurement actions.

---

## ✨ Key Features

### 1. Next Fuel Price Rise Forecast
- **Expected Timing Window**: Models the 10–14 day ARA Rotterdam wholesale barge pass-through lag into UK forecourt bulk tanks to project when pump prices will adjust (e.g. *Near-Term: 3–7 Days*).
- **Predicted Rise Magnitude**: Discrete choice distribution and confidence estimates for expected pence-per-litre increases (e.g. *+2.1p to +2.7p/L*).
- **Projected Pump Prices**: Forecasts adjusted UK national averages, supermarket averages, and motorway service station price ceilings.
- **Calibrated Bayesian Likelihood (Noul)**: Computes the structured probability of an impending retail price spike.
- **Tank Fill Cost Impact Calculator**: Calculates real-world refuelling cost increases for:
  - **Family Hatchbacks** (55L tank)
  - **Large SUVs / Fleet Vans** (80L tank)
  - **Commercial HGVs** (400L tank)
- **Driver & Fleet Directive**: Actionable refuelling advice (e.g. *Fill up before the weekend to beat forecourt margin adjustments*).

### 2. Live Forecourt & Supermarket Tracking
- **Fuel Comparisons**: Real-time switching between UK Diesel (Standard B7 / Premium) and UK Petrol (Unleaded E10 / Super E5).
- **Forecourt Tiers**:
  - Supermarkets (*Asda, Tesco, Morrisons, Sainsbury's*)
  - Oil Majors (*Shell, BP, Esso, Texaco, Gulf, Jet*)
  - Motorway Service Areas (*Moto, Welcome Break, Roadchef*)
- **Regional Benchmarks**: Covers England, Scotland, Wales, Northern Ireland, Greater London, and regional corridors.
- **Official Price Indices**: Benchmarked against CMA (Competition and Markets Authority) and DESNZ (Department for Energy Security and Net Zero) official publications.

### 3. Statutory Pump Price Breakdown & Tank Cost Calculator
- Transparency breakdown into:
  - Wholesale product cost
  - Fuel Duty (52.95p per litre)
  - VAT (20% applied to product and duty)
  - Distribution and biofuel compounding costs
  - Retailer and supermarket operating margins
- Interactive refuelling trip cost and annual mileage expense estimator.

### 4. Developer Tools & Code Generation
- Export and copy ready-to-run Python SDK snippets targeting the `typesafe-sdk` library.
- Sub-150ms prediction latency reporting.

---

## 🛠️ Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/)
  - [Vite 8](https://vite.dev/)
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Motion](https://motion.dev/) (smooth layout animations)
  - [Lucide React](https://lucide.dev/) (icons)
- **Backend & API**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [tsx](https://github.com/privatenumber/tsx) (dev execution)
  - [esbuild](https://esbuild.github.io/) (production CJS server bundling)
  - TypeSafe Jev API proxy with calibrated deterministic fallback engine

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or later
- **npm** or **bun** / **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/typesafe-jev-fuel-predictor.git
   cd typesafe-jev-fuel-predictor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your keys:
   ```env
   # Optional: Your TypeSafe AI API Key for live Jev model inferences
   TYPESAFE_API_KEY="ts_live_your_key_here"

   # Optional: Google Gemini API key if using server-side Gemini features
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
   *(Note: If `TYPESAFE_API_KEY` is not provided, the application automatically uses a calibrated local Bayesian fallback engine to evaluate real UK forecourt spreads).*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

Compile the Vite frontend assets and bundle the Express backend server with `esbuild`:

```bash
npm run build
npm start
```

The production server starts on port `3000` (`http://localhost:3000`).

---

## 💻 TypeSafe Python SDK Example

You can query Jev directly in your Python applications using the `typesafe-sdk`:

```python
import asyncio
from typesafe import TypeSafeClient

async def predict_uk_fuel_rise():
    client = TypeSafeClient(api_key="ts_live_YOUR_KEY")

    # 1. State definition representing current UK wholesale & retail indicators
    market_state = """
    UK Fuel Commodity Indicators:
    - Fuel Type: Ultra-Low Sulphur Diesel (B7)
    - UK National Pump Average: 144.9p/L
    - Supermarket Pump Average: 140.4p/L
    - Motorway Forecourt Average: 173.4p/L
    - Brent Crude: $97.00/bbl (£72.44/bbl at GBP/USD 1.339)
    - ARA Rotterdam Wholesale Gasoil Cargoes: up +4.2% over 7 days
    - Wholesale-to-retail lag: 10-14 days pass-through remaining
    """

    # 2. Typed structured questions for the Jev model
    questions = {
        "next_price_rise_timing": {
            "type": "choice",
            "prompt": "When will the next fuel pump price rise take effect across UK forecourts?",
            "choices": [
                "Immediate (1–2 Days): Imminent supermarket margin adjustment",
                "Near-Term (3–7 Days): Pass-through of crude & refinery crack rally",
                "Medium-Term (8–14 Days): Delayed wholesale inventory replacement",
                "Stable / No Rise (<14 Days): Forecourt margins absorb wholesale fluctuations"
            ]
        },
        "next_price_rise_magnitude": {
            "type": "choice",
            "prompt": "What will be the magnitude of the next UK fuel price rise?",
            "choices": [
                "Marginal Rise (+0.5p to +1.2p/L)",
                "Moderate Rise (+1.8p to +2.9p/L)",
                "Significant Rise (+3.0p to +4.5p/L)",
                "Severe Spike (> +4.5p/L)"
            ]
        },
        "probability_of_rise": {
            "type": "noul",
            "proposition": "UK forecourt fuel pump prices will increase within the next 7 days."
        }
    }

    # 3. Evaluate state with Jev (no text generation, direct typed structures)
    response = await client.predict(
        model="jev",
        state=market_state,
        questions=questions
    )

    print("Timing:", response["next_price_rise_timing"]["choice"])
    print("Magnitude:", response["next_price_rise_magnitude"]["choice"])
    print("Probability of Rise:", f"{response['probability_of_rise']['probability'] * 100:.1f}%")

if __name__ == "__main__":
    asyncio.run(predict_uk_fuel_rise())
```

---

## 🔒 Security & Data Privacy

- All third-party API keys (TypeSafe, Gemini) are stored and accessed strictly on the Node.js/Express server side and are never exposed to the client browser.
- External API calls are proxied through `/api/jev/predict` and `/api/health`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Forecourt and statutory data structures are aligned with UK CMA open monitoring frameworks and DESNZ reporting standards.
