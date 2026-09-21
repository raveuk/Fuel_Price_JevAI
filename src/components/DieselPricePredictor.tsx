import React, { useState, useEffect, useMemo } from 'react';
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Zap,
  Truck,
  Building2,
  Droplets,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Car,
  AlertTriangle,
  Scale,
  Activity,
  Radio,
  Play,
  Pause,
  Clock,
  Cpu,
  Terminal,
  Calendar,
  Flame,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import { JevPredictorCard } from './JevPredictorCard';

interface MarketOverview {
  country: string;
  currency: string;
  currencySymbol: string;
  unit: string;
  liveBrentUSD: number;
  prevBrentUSD: number;
  brentDeltaUSD: number;
  brentDeltaPct: number;
  liveGBPUSD: number;
  prevGBPUSD: number;
  fxDelta: number;
  brentGBP: number;
  crudePencePerL: number;
  refiningAndBiofuelPence: number;
  wholesaleDeliveredPence: number;
  wholesaleDeltaPence: number;
  fuelDutyPence: number;
  vatRatePct: number;
  vatPence: number;
  retailForecourtMarginPence: number;
  ukNationalAveragePence: number;
  prevUKNationalAveragePence: number;
  ukDeltaPence: number;
  ukDeltaPct: number;
  supermarketAveragePence: number;
  motorwayAveragePence: number;
  spreadSupermarketVsMotorway: number;
  cheapestRegion: string;
  highestRegion: string;
}

interface RegionItem {
  id: string;
  category: string;
  name: string;
  regionCode: string;
  pricePence: number;
  priceGbp: number;
  change24hPence: number;
  changePct: number;
  fuelDutyPence: number;
  spreadVsNational: number;
  description: string;
}

interface RetailerItem {
  id: string;
  name: string;
  category: 'supermarket' | 'forecourt' | 'branded' | 'motorway';
  pricePence: number;
  priceGbp: number;
  forecourtsCount: number;
  loyaltyProgram: string;
  amenities: string[];
  description: string;
}

interface GradeItem {
  id: string;
  name: string;
  standard: string;
  pricePence: number;
  priceGbp: number;
  dutyPence: number;
  vatPence: number;
  cetaneNumber: number;
  description: string;
  availability: string;
}

interface HistoryPoint {
  date: string;
  brentGBP: number;
  wholesalePence: number;
  nationalPumpPence: number;
  supermarketPumpPence: number;
  motorwayPumpPence: number;
}

interface TankFillItem {
  tankLitres: number;
  totalCostGbp: number;
  dutyGbp: number;
  vatGbp: number;
  wholesaleGbp: number;
  supermarketSavingGbp: number;
  motorwayPremiumGbp: number;
}

interface DieselDataset {
  timestamp: string;
  marketOverview: MarketOverview;
  tankCalculations: {
    hatchback55L: TankFillItem;
    largeSuvVan80L: TankFillItem;
    hgv400L: TankFillItem;
  };
  history: HistoryPoint[];
  regions: RegionItem[];
  retailers: RetailerItem[];
  grades: GradeItem[];
}

interface JevPredictionResult {
  next_price_rise_timing?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  next_price_rise_magnitude?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  projected_next_pump_price?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  primary_rise_catalyst?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  probability_of_rise_noul?: {
    probability: number;
    boolean: boolean;
  };
  recommended_driver_action?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  uk_diesel_direction_7d?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  uk_supermarket_margin_behavior?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  uk_motorist_fleet_action?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  uk_target_pump_tier_7d?: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  uk_price_spike_risk_proposition?: {
    probability: number;
    boolean: boolean;
  };
  uk_sterling_vulnerability_score?: {
    score: number;
    confidence: number;
    legend?: Record<string, string>;
    probabilities?: Record<string, number>;
  };
  [key: string]: any;
}

export const DieselPricePredictor: React.FC = () => {
  const { apiKey, effectiveKeyPresent } = useApiKey();

  // Fuel Type State (Petrol vs Diesel)
  const [selectedFuel, setSelectedFuel] = useState<'petrol' | 'diesel'>('diesel');

  // Data loading state
  const [data, setData] = useState<DieselDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter & view states
  const [activeTab, setActiveTab] = useState<'all' | 'supermarkets' | 'regions' | 'motorways' | 'branded' | 'grades'>('all');
  const [unitMode, setUnitMode] = useState<'pence' | 'gbp' | 'tank'>('pence');
  const [selectedTankSize, setSelectedTankSize] = useState<number>(55); // 55L, 70L, 80L, 400L
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'spread' | 'name'>('price_asc');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Jev Prediction state
  const [predicting, setPredicting] = useState<boolean>(false);
  const [predictionResults, setPredictionResults] = useState<JevPredictionResult | null>(null);
  const [predictionLatency, setPredictionLatency] = useState<number | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [customScenario, setCustomScenario] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Automatic live refresh states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(3); // 3s, 5s, 10s, 30s
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] = useState<number>(3);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [flashingKey, setFlashingKey] = useState<string | null>(null);

  // Fetch live UK fuel data for the selected fuel type
  const loadFuelPrices = async (fuel: 'petrol' | 'diesel' = selectedFuel, isBackground: boolean = false) => {
    try {
      if (!isBackground) {
        setRefreshing(true);
      }
      setError(null);
      const res = await fetch(`/api/fuel/diesel-prices?fuel=${fuel}&_t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch UK ${fuel} prices: HTTP ${res.status}`);
      }
      const json: DieselDataset = await res.json();
      setData(json);
      setLastUpdatedTime(new Date());

      // Trigger a brief visual pulse/flash on metrics
      setFlashingKey(Date.now().toString());
      setTimeout(() => setFlashingKey(null), 900);
    } catch (err: any) {
      console.error(`Error fetching UK ${fuel} prices:`, err);
      if (!isBackground) {
        setError(err.message || `Failed to load live UK ${fuel} prices`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFuelPrices(selectedFuel, false);
    setSecondsUntilNextRefresh(refreshIntervalSec);
  }, [selectedFuel, refreshIntervalSec]);

  // Automatic live countdown & auto-refresh interval effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          loadFuelPrices(selectedFuel, true);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshIntervalSec, selectedFuel]);

  // Run Jev UK Fuel Prediction (adapts prompts, scenarios and parameters based on selectedFuel)
  const runJevForecast = async (overrideScenario?: string) => {
    if (!data) return;
    setPredicting(true);
    setPredictionError(null);

    const m = data.marketOverview;
    const isPetrol = selectedFuel === 'petrol';
    const fuelLabel = isPetrol ? 'Petrol (E10 Unleaded)' : 'Diesel (B7 ULSD)';
    const refiningLabel = isPetrol ? 'Gasoline ARA crack & E10 ethanol blending margin is 18.2p/L' : 'ARA Rotterdam gasoil refining margin is 24.5p/L';

    const scenarioText =
      overrideScenario ||
      customScenario.trim() ||
      `Current UK ${fuelLabel} Market State: UK National Average ${fuelLabel} is ${m.ukNationalAveragePence.toFixed(
        1
      )}p/L (24h change ${m.ukDeltaPence >= 0 ? '+' : ''}${m.ukDeltaPence}p/L). Supermarkets average ${m.supermarketAveragePence.toFixed(
        1
      )}p/L (-${(m.ukNationalAveragePence - m.supermarketAveragePence).toFixed(
        1
      )}p/L saving) while Motorway Service Areas charge ${m.motorwayAveragePence.toFixed(1)}p/L (+${(
        m.motorwayAveragePence - m.ukNationalAveragePence
      ).toFixed(1)}p/L premium). Global Brent crude is $${m.liveBrentUSD.toFixed(2)}/bbl (£${m.brentGBP.toFixed(
        2
      )}/bbl) with GBP/USD exchange rate at $${m.liveGBPUSD.toFixed(4)}. Statutory UK fuel duty is ${m.fuelDutyPence}p/L and VAT is 20% (${m.vatPence.toFixed(
        1
      )}p/L). CMA forecourt monitoring reports average retailer forecourt margin at ${m.retailForecourtMarginPence}p/L. ${refiningLabel}.`;

    const questionsPayload = {
      next_price_rise_timing: {
        type: 'choice',
        prompt: `Predict the expected timing / window of the next retail ${isPetrol ? 'petrol' : 'diesel'} pump price rise across UK forecourts`,
        options: [
          'Near-Term (3–7 Days): Pass-through of crude & refinery crack rally',
          'Imminent (1–2 Days): Fast-moving forecourts matching upstream spikes',
          'Mid-Term (8–14 Days): Delayed adjustment as supermarket inventory buffers stock',
          'Extended Horizon (15–30 Days): Resilient regional inventory stock',
          'Price Freeze / Cut Expected: Wholesale softening overrides upside'
        ]
      },
      next_price_rise_magnitude: {
        type: 'choice',
        prompt: `Forecast the magnitude of the next UK retail ${isPetrol ? 'petrol' : 'diesel'} pump price rise (in pence per litre)`,
        options: [
          'Moderate Rise (+1.8p to +2.9p/L): Typical wholesale lag absorption',
          'Significant Hike (+3.0p to +4.5p/L): Compounded crude rally & crack spread',
          'Marginal Uptick (+0.5p to +1.7p/L): Supermarket price matching dampens surge',
          'Severe Price Spike (> +4.5p/L): Geopolitical supply shock pass-through',
          'No Rise / Downward Easing (0p to -1.5p/L): Downward pressure overrides'
        ]
      },
      projected_next_pump_price: {
        type: 'choice',
        prompt: `Anticipated new UK National Average retail pump price following the next price rise`,
        options: [
          `Tier 1 (+0.8p): ~${(m.ukNationalAveragePence + 0.8).toFixed(1)}p/L (Subtle uptick)`,
          `Tier 2 (+2.4p): ~${(m.ukNationalAveragePence + 2.4).toFixed(1)}p/L (Baseline Expected Rise)`,
          `Tier 3 (+3.8p): ~${(m.ukNationalAveragePence + 3.8).toFixed(1)}p/L (Accelerated Pass-Through)`,
          `Tier 4 (+5.5p): Above ${(m.ukNationalAveragePence + 5.0).toFixed(1)}p/L (Severe Rally)`,
          `Tier 0 (No Rise): Around ${m.ukNationalAveragePence.toFixed(1)}p/L (Unchanged)`
        ]
      },
      primary_rise_catalyst: {
        type: 'choice',
        prompt: `Primary market catalyst and transmission vector driving the next price rise`,
        options: [
          'Brent Crude Rally in USD passing through to ARA Rotterdam wholesale barges',
          'Sterling Foreign Exchange Slide vs US Dollar',
          'Refinery Crack Spread & Biofuel Mandate (RTFO/E10 compliance costs)',
          'Retail Forecourt Margin Restoration by major supermarket operators'
        ]
      },
      probability_of_rise_noul: {
        type: 'noul',
        statement: `Will the UK retail national average ${isPetrol ? 'petrol' : 'diesel'} pump price experience an increase within the next 10 days?`
      },
      recommended_driver_action: {
        type: 'choice',
        prompt: `Actionable procurement advice for UK motorists, commercial fleets, and hauliers`,
        options: [
          'Fill Up Before Weekend: Beat anticipated wholesale pump pass-through',
          'Target Supermarket Forecourts: Capitalize on ~4.5p/L price spread',
          'Stagger Refueling: Normal driving routine with minimal exposure',
          'Commercial Fleets: Pre-book bunkered depot fuel orders'
        ]
      },
      uk_diesel_direction_7d: {
        type: 'choice',
        prompt: `Predict UK national average retail ${isPetrol ? 'petrol (unleaded)' : 'diesel'} pump price movement over the next 7 to 14 days`,
        options: [
          'Sharp Increase (> +2.5p/L)',
          'Moderate Rise (+0.8p to +2.5p/L)',
          'Stable / Rangebound (±0.8p/L)',
          'Softening / Easing (-0.8p to -2.5p/L)',
          'Sharp Fall (> -2.5p/L)'
        ]
      },
      uk_supermarket_margin_behavior: {
        type: 'choice',
        prompt: `Anticipated UK supermarket forecourt pricing behavior for ${isPetrol ? 'petrol' : 'diesel'} (Asda, Tesco, Morrisons, Sainsbury's)`,
        options: [
          'Supermarket Price War (absorb wholesale cost increases to drive footfall)',
          'Widening Margins (retaining higher retail margins despite CMA scrutiny)',
          'Standard Margin Pass-Through (direct tracking of ARA wholesale benchmark)',
          'Aggressive Discount Vouchers (linking fuel savings to grocery spend)'
        ]
      },
      uk_motorist_fleet_action: {
        type: 'choice',
        prompt: `Recommended UK driver and fleet fuel procurement strategy for ${isPetrol ? 'petrol' : 'diesel'}`,
        options: [
          'Fill Up Immediately (beat upcoming wholesale pass-through)',
          'Divert Exclusively to Supermarkets (capture ~4-5p/L spread)',
          'Routine Staggered Fueling (neutral market posture)',
          isPetrol ? 'Seek High-Volume Supermarket Forecourts' : 'Commercial Logistics: Pre-order Bunkered Depot Bulk Fuel'
        ]
      },
      uk_target_pump_tier_7d: {
        type: 'choice',
        prompt: `Forecasted UK National Average Retail ${isPetrol ? 'Petrol' : 'Diesel'} Bracket in 7 Days`,
        options: [
          `Under ${(m.ukNationalAveragePence - 3.0).toFixed(1)}p/L`,
          `${(m.ukNationalAveragePence - 3.0).toFixed(1)}p to ${(m.ukNationalAveragePence - 0.5).toFixed(1)}p/L`,
          `${(m.ukNationalAveragePence - 0.5).toFixed(1)}p to ${(m.ukNationalAveragePence + 2.0).toFixed(1)}p/L`,
          `${(m.ukNationalAveragePence + 2.0).toFixed(1)}p to ${(m.ukNationalAveragePence + 4.5).toFixed(1)}p/L`,
          `Above ${(m.ukNationalAveragePence + 4.5).toFixed(1)}p/L`
        ]
      },
      uk_price_spike_risk_proposition: {
        type: 'noul',
        statement: `Will the UK national average retail ${isPetrol ? 'petrol' : 'diesel'} price exceed ${(m.ukNationalAveragePence + 3.0).toFixed(
          1
        )}p/L within the next 14 days?`
      },
      uk_sterling_vulnerability_score: {
        type: 'score',
        prompt: `Evaluate UK ${isPetrol ? 'petrol' : 'diesel'} pump vulnerability to GBP/USD currency slides and geopolitical crude supply shocks`,
        levels: ['Minimal Risk', 'Low Vulnerability', 'Moderate Exposure', 'High Currency Sensitivity', 'Critical Supply Dislocation']
      }
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey && apiKey.trim()) {
        headers['x-typesafe-api-key'] = apiKey.trim();
      }

      const res = await fetch('/api/jev/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          state: scenarioText,
          questions: questionsPayload
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setPredictionResults(result.results || result.answers);
      setPredictionLatency(result.latencyMs);
    } catch (err: any) {
      console.error('Error in Jev UK diesel prediction:', err);
      setPredictionError(err.message || 'Failed to generate prediction');
    } finally {
      setPredicting(false);
    }
  };

  // Auto-run baseline prediction once data is loaded
  useEffect(() => {
    if (data && !predictionResults && !predicting && !predictionError) {
      runJevForecast();
    }
  }, [data]);

  // Helper for displaying price based on unitMode
  const formatDisplayPrice = (pence: number) => {
    if (unitMode === 'gbp') {
      return `£${(pence / 100).toFixed(3)}/L`;
    }
    if (unitMode === 'tank') {
      const cost = (pence * selectedTankSize) / 100;
      return `£${cost.toFixed(2)}`;
    }
    return `${pence.toFixed(1)}p/L`;
  };

  // Filtered lists
  const filteredRetailers = useMemo(() => {
    if (!data) return [];
    let list = data.retailers;
    if (activeTab === 'supermarkets') {
      list = list.filter((r) => r.category === 'supermarket');
    } else if (activeTab === 'motorways') {
      list = list.filter((r) => r.category === 'motorway');
    } else if (activeTab === 'branded') {
      list = list.filter((r) => r.category === 'branded' || r.category === 'forecourt');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.loyaltyProgram.toLowerCase().includes(q) ||
          r.amenities.some((a) => a.toLowerCase().includes(q)) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePence - b.pricePence;
      if (sortBy === 'price_desc') return b.pricePence - a.pricePence;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.pricePence - b.pricePence;
    });
  }, [data, activeTab, searchQuery, sortBy]);

  const filteredRegions = useMemo(() => {
    if (!data) return [];
    let list = data.regions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.regionCode.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePence - b.pricePence;
      if (sortBy === 'price_desc') return b.pricePence - a.pricePence;
      if (sortBy === 'spread') return a.spreadVsNational - b.spreadVsNational;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.pricePence - b.pricePence;
    });
  }, [data, searchQuery, sortBy]);

  const filteredGrades = useMemo(() => {
    if (!data) return [];
    let list = data.grades;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.standard.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.availability.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, searchQuery]);

  const copyPythonSnippet = () => {
    if (!data) return;
    const m = data.marketOverview;
    const snippet = `import asyncio
from typesafe import AsyncTypeSafeClient

async def forecast_uk_diesel_prices():
    client = AsyncTypeSafeClient() # Reads TYPESAFE_API_KEY from environment
    
    # Condition Jev on live UK fuel market benchmarks (DESNZ, CMA, Platts, Bank of England)
    uk_market_state = """
    UK National Average Diesel Pump Price: ${m.ukNationalAveragePence.toFixed(1)}p/L (£${(m.ukNationalAveragePence / 100).toFixed(3)}/L)
    UK Supermarket Forecourt Average: ${m.supermarketAveragePence.toFixed(1)}p/L (Asda, Tesco, Morrisons, Sainsbury's)
    UK Motorway Service Area Average: ${m.motorwayAveragePence.toFixed(1)}p/L (+${(m.motorwayAveragePence - m.ukNationalAveragePence).toFixed(1)}p/L MSA premium)
    Brent Crude Oil: $${m.liveBrentUSD.toFixed(2)}/bbl (£${m.brentGBP.toFixed(2)}/barrel)
    GBP/USD Exchange Rate: $${m.liveGBPUSD.toFixed(4)}
    UK Statutory Fuel Duty: ${m.fuelDutyPence}p/L (52.95p standard rate)
    UK Fuel VAT: 20% (${m.vatPence.toFixed(1)}p/L)
    Delivered Wholesale Gasoil (ARA Platts): ${m.wholesaleDeliveredPence.toFixed(1)}p/L
    CMA Average Forecourt Margin: ${m.retailForecourtMarginPence}p/L
    """
    
    questions = {
        "uk_diesel_direction_7d": {
            "type": "choice",
            "prompt": "Predict UK national diesel price trend over next 7-14 days",
            "options": [
                "Sharp Increase (> +2.5p/L)",
                "Moderate Rise (+0.8p to +2.5p/L)",
                "Stable / Rangebound (±0.8p/L)",
                "Softening / Easing (-0.8p to -2.5p/L)",
                "Sharp Fall (> -2.5p/L)"
            ]
        },
        "uk_supermarket_margin_behavior": {
            "type": "choice",
            "prompt": "Supermarket pricing response to current wholesale crude margins",
            "options": [
                "Supermarket Price War (absorb wholesale increases)",
                "Widening Margins (retaining retail spreads)",
                "Standard Margin Pass-Through",
                "Aggressive Discount Vouchers"
            ]
        },
        "uk_price_spike_risk_proposition": {
            "type": "noul",
            "statement": "Will the UK national average diesel price exceed ${(m.ukNationalAveragePence + 3.0).toFixed(1)}p/L in next 14 days?"
        },
        "uk_sterling_vulnerability_score": {
            "type": "score",
            "prompt": "Assess UK fuel pump price sensitivity to Sterling slides and crude supply shocks",
            "levels": ["Minimal Risk", "Low Vulnerability", "Moderate Exposure", "High Currency Sensitivity", "Critical Supply Dislocation"]
        }
    }
    
    response = await client.predict(state=uk_market_state, questions=questions)
    
    print("Jev UK Diesel Forecast:")
    print("Price Direction:", response.results["uk_diesel_direction_7d"].choice)
    print("Confidence:", f"{response.results['uk_diesel_direction_7d'].confidence * 100:.1f}%")
    print("Spike Risk Probability:", f"{response.results['uk_price_spike_risk_proposition'].probability * 100:.1f}%")

if __name__ == "__main__":
    asyncio.run(forecast_uk_diesel_prices())`;

    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const m = data?.marketOverview;

  return (
    <div className="space-y-6">
      {/* Top Banner: UK Focus Badge & Sub-tabs for Petrol and Diesel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900/90 p-4 sm:p-5 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                UK Fuel Price Intelligence
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                United Kingdom Only
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300 border border-zinc-700">
                DESNZ • CMA • Platts ARA
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live UK forecourt pump tracking for Petrol &amp; Diesel, supermarket price spreads, statutory duty &amp; VAT tax breakdown, and TypeSafe Jev AI probabilistic forecast.
            </p>
          </div>
        </div>

        {/* Live Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Automatic Live Refresh Badge & Interval Picker */}
          <div className="flex items-center gap-1.5 rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? 'Pause Automatic Live Refresh' : 'Resume Automatic Live Refresh'}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                autoRefreshEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {autoRefreshEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono">LIVE {secondsUntilNextRefresh}s</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  <span>Paused</span>
                </>
              )}
            </button>

            {/* Speed Selector */}
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              disabled={!autoRefreshEnabled}
              className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50 cursor-pointer disabled:opacity-40"
            >
              <option value={2}>2s tick</option>
              <option value={3}>3s tick</option>
              <option value={5}>5s tick</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
            </select>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
            <button
              onClick={() => setUnitMode('pence')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                unitMode === 'pence'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              p/Litre
            </button>
            <button
              onClick={() => setUnitMode('gbp')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                unitMode === 'gbp'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              £/Litre
            </button>
            <button
              onClick={() => setUnitMode('tank')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                unitMode === 'tank'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              £/Tank Fill
            </button>
          </div>

          <button
            onClick={() => loadFuelPrices(selectedFuel, false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Fuel Type Switcher Sub-Tabs: Petrol vs Diesel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center p-1 rounded-lg bg-zinc-950 border border-zinc-800 w-full sm:w-auto">
            <button
              id="subtab-petrol"
              onClick={() => {
                if (selectedFuel !== 'petrol') {
                  setSelectedFuel('petrol');
                  setPredictionResults(null);
                }
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-md px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                selectedFuel === 'petrol'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Droplets className="h-4 w-4" />
              <span>Petrol (Unleaded E10 / Premium E5)</span>
            </button>
            <button
              id="subtab-diesel"
              onClick={() => {
                if (selectedFuel !== 'diesel') {
                  setSelectedFuel('diesel');
                  setPredictionResults(null);
                }
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-md px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                selectedFuel === 'diesel'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Fuel className="h-4 w-4" />
              <span>Diesel (B7 ULSD / Premium / HVO)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 px-2 self-start sm:self-auto">
          <span className="font-semibold text-zinc-300">Active View:</span>
          <span className="capitalize font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
            {selectedFuel === 'petrol' ? 'Petrol (E10)' : 'Diesel (B7)'}
          </span>
          <span>• Jev AI probabilistic forecast conditioned on {selectedFuel} benchmarks</span>
        </div>
      </div>

      {/* Tank Size Selector Sub-Bar when unitMode === 'tank' */}
      {unitMode === 'tank' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <Car className="h-4 w-4 text-amber-400" />
            <span>Select UK Vehicle Tank Capacity:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { size: 55, label: '55 Litres (Family Hatch / Golf / 1-Series)' },
              { size: 70, label: '70 Litres (Large SUV / Estate / Evoque)' },
              { size: 80, label: '80 Litres (Transit Van / Sprinter)' },
              { size: 400, label: '400 Litres (Commercial HGV / Lorry)' }
            ].map((t) => (
              <button
                key={t.size}
                onClick={() => setSelectedTankSize(t.size)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  selectedTankSize === t.size
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top UK Live Metric Cards */}
      {m && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`inline-flex h-full w-full rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
              </span>
              <span className="font-medium text-zinc-300">
                Live Forecourt Pump &amp; Commodity Feeds
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                • Synced {lastUpdatedTime.toLocaleTimeString('en-GB')}
              </span>
            </div>
            {autoRefreshEnabled && (
              <span className="text-[11px] font-mono text-emerald-400">
                Next price update in {secondsUntilNextRefresh}s
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: UK National Average */}
            <div className={`rounded-xl border bg-zinc-900/80 p-3.5 flex flex-col justify-between transition-all duration-300 ${flashingKey ? 'border-amber-500/80 shadow-md shadow-amber-500/10' : 'border-zinc-800'}`}>
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>UK National Avg</span>
                  <span className="font-mono text-[10px] text-zinc-500">8,350 Forecourts</span>
                </div>
                <div className={`text-xl font-extrabold text-white tracking-tight transition-colors duration-300 ${flashingKey ? 'text-amber-300' : 'text-white'}`}>
                  {formatDisplayPrice(m.ukNationalAveragePence)}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {m.ukDeltaPence >= 0 ? (
                  <span className="flex items-center text-rose-400 font-medium font-mono text-[11px]">
                    <TrendingUp className="h-3 w-3 mr-0.5" />+{m.ukDeltaPence}p/L (+{m.ukDeltaPct}%)
                  </span>
                ) : (
                  <span className="flex items-center text-emerald-400 font-medium font-mono text-[11px]">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {m.ukDeltaPence}p/L ({m.ukDeltaPct}%)
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Supermarket Average */}
            <div className={`rounded-xl border bg-emerald-950/20 p-3.5 flex flex-col justify-between transition-all duration-300 ${flashingKey ? 'border-emerald-400 shadow-md shadow-emerald-500/10' : 'border-emerald-500/30'}`}>
              <div>
                <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                  <span className="font-semibold">Supermarket Avg</span>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] text-emerald-300">
                    Save 4.8p/L
                  </span>
                </div>
                <div className="text-xl font-extrabold text-emerald-300 tracking-tight">
                  {formatDisplayPrice(m.supermarketAveragePence)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400">
                Asda, Tesco, Morrisons, Sainsbury's
              </div>
            </div>

            {/* Card 3: Motorway Service Areas */}
            <div className={`rounded-xl border bg-rose-950/20 p-3.5 flex flex-col justify-between transition-all duration-300 ${flashingKey ? 'border-rose-400 shadow-md shadow-rose-500/10' : 'border-rose-500/30'}`}>
              <div>
                <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
                  <span className="font-semibold">Motorways (MSAs)</span>
                  <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[9px] text-rose-300">
                    +27.5p/L Premium
                  </span>
                </div>
                <div className="text-xl font-extrabold text-rose-300 tracking-tight">
                  {formatDisplayPrice(m.motorwayAveragePence)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400">
                M1, M4, M5, M6, M25, M40 Corridors
              </div>
            </div>

            {/* Card 4: Brent Crude in GBP */}
            <div className={`rounded-xl border bg-zinc-900/80 p-3.5 flex flex-col justify-between transition-all duration-300 ${flashingKey ? 'border-amber-400/80 shadow-md shadow-amber-500/10' : 'border-zinc-800'}`}>
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Brent Crude</span>
                  <span className="font-mono text-[10px] text-amber-400">£/barrel</span>
                </div>
                <div className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${flashingKey ? 'text-amber-300' : 'text-white'}`}>
                  £{m.brentGBP.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                ${m.liveBrentUSD.toFixed(2)} USD • {m.brentDeltaPct >= 0 ? '+' : ''}
                {m.brentDeltaPct}%
              </div>
            </div>

            {/* Card 5: GBP / USD Exchange Rate */}
            <div className={`rounded-xl border bg-zinc-900/80 p-3.5 flex flex-col justify-between transition-all duration-300 ${flashingKey ? 'border-blue-400/80 shadow-md shadow-blue-500/10' : 'border-zinc-800'}`}>
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>GBP / USD</span>
                  <span className="font-mono text-[10px] text-zinc-500">Forex Cable</span>
                </div>
                <div className={`text-xl font-extrabold tracking-tight font-mono transition-colors duration-300 ${flashingKey ? 'text-blue-300' : 'text-white'}`}>
                  ${m.liveGBPUSD.toFixed(4)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400">
                {m.fxDelta >= 0 ? 'Sterling strengthening' : 'Sterling softening vs USD'}
              </div>
            </div>

            {/* Card 6: UK Statutory Tax Share */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
                  <span className="font-semibold">UK Fuel Tax Share</span>
                  <span className="font-mono text-[10px] text-amber-300">HMRC Duty + VAT</span>
                </div>
                <div className="text-xl font-extrabold text-amber-300 tracking-tight">
                  {((((m.fuelDutyPence + m.vatPence) / m.ukNationalAveragePence) * 100)).toFixed(1)}%
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                {m.fuelDutyPence}p duty + 20% VAT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Section: Next Fuel Price Rise Forecast & TypeSafe Jev AI Predictor */}
      <JevPredictorCard
        data={data}
        selectedFuel={selectedFuel}
        setSelectedFuel={(fuel) => {
          setSelectedFuel(fuel);
          setPredictionResults(null);
        }}
        predicting={predicting}
        predictionResults={predictionResults}
        predictionLatency={predictionLatency}
        customScenario={customScenario}
        setCustomScenario={setCustomScenario}
        runJevForecast={runJevForecast}
        copyPythonSnippet={copyPythonSnippet}
        copiedCode={copiedCode}
      />

      {/* Statutory Price Breakdown & Interactive Vehicle Tank Calculator */}
      {m && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: UK Statutory Anatomy of a Litre of Petrol/Diesel */}
          <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-400" />
                  <span>Anatomy of 1 Litre of UK Road {selectedFuel === 'petrol' ? 'Petrol' : 'Diesel'} (DESNZ Model)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Official decomposition of the {m.ukNationalAveragePence.toFixed(1)}p national pump price
                </p>
              </div>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-700">
                Total: {m.ukNationalAveragePence.toFixed(1)}p / Litre
              </span>
            </div>

            {/* Visual Stacked Progress Bar */}
            <div className="h-5 w-full rounded-full overflow-hidden flex bg-zinc-950 border border-zinc-800">
              {/* Crude Oil Cost */}
              <div
                style={{ width: `${(m.crudePencePerL / m.ukNationalAveragePence) * 100}%` }}
                className="bg-zinc-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`Crude Oil: ${m.crudePencePerL}p/L (${((m.crudePencePerL / m.ukNationalAveragePence) * 100).toFixed(0)}%)`}
              />
              {/* Refining & Biofuel RTFO */}
              <div
                style={{ width: `${(m.refiningAndBiofuelPence / m.ukNationalAveragePence) * 100}%` }}
                className="bg-blue-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`Refining & Biofuel: ${m.refiningAndBiofuelPence}p/L (${((m.refiningAndBiofuelPence / m.ukNationalAveragePence) * 100).toFixed(0)}%)`}
              />
              {/* Forecourt Margin */}
              <div
                style={{ width: `${(m.retailForecourtMarginPence / m.ukNationalAveragePence) * 100}%` }}
                className="bg-purple-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`Forecourt Margin: ${m.retailForecourtMarginPence}p/L (${((m.retailForecourtMarginPence / m.ukNationalAveragePence) * 100).toFixed(0)}%)`}
              />
              {/* UK Fuel Duty */}
              <div
                style={{ width: `${(m.fuelDutyPence / m.ukNationalAveragePence) * 100}%` }}
                className="bg-amber-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`UK Fuel Duty: ${m.fuelDutyPence}p/L (${((m.fuelDutyPence / m.ukNationalAveragePence) * 100).toFixed(0)}%)`}
              />
              {/* VAT 20% */}
              <div
                style={{ width: `${(m.vatPence / m.ukNationalAveragePence) * 100}%` }}
                className="bg-emerald-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`VAT 20%: ${m.vatPence}p/L (${((m.vatPence / m.ukNationalAveragePence) * 100).toFixed(0)}%)`}
              />
            </div>

            {/* Breakdown Components Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  <span>Crude Oil (Brent)</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">{m.crudePencePerL}p / L</div>
                <div className="text-[11px] text-zinc-500">{((m.crudePencePerL / m.ukNationalAveragePence) * 100).toFixed(1)}% of total</div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Refining &amp; Biofuel</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">{m.refiningAndBiofuelPence}p / L</div>
                <div className="text-[11px] text-zinc-500">ARA Gasoil crack &amp; RTFO</div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Forecourt Margin</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">{m.retailForecourtMarginPence}p / L</div>
                <div className="text-[11px] text-zinc-500">CMA monitored average</div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-2.5 border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-semibold">UK Fuel Duty</span>
                </div>
                <div className="text-sm font-bold text-amber-300 font-mono">{m.fuelDutyPence}p / L</div>
                <div className="text-[11px] text-zinc-500">Standard statutory rate</div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-2.5 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">UK VAT (20%)</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 font-mono">{m.vatPence}p / L</div>
                <div className="text-[11px] text-zinc-500">Tax on fuel + duty</div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                  <span className="font-semibold">Combined HMT Tax</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {(m.fuelDutyPence + m.vatPence).toFixed(2)}p / L
                </div>
                <div className="text-[11px] text-zinc-500">Direct to HM Treasury</div>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Cost of a Full Tank (UK Vehicles) */}
          <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-400" />
                  <span>Cost of a Full Tank (UK Fleet)</span>
                </h3>
                <span className="text-xs text-zinc-400">At National Avg</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Real-world tank fill costs based on current {m.ukNationalAveragePence.toFixed(1)}p/L pump price
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {/* 55L Hatchback */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">55L Family Car (Golf / Focus / 320d)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Duty: £{data.tankCalculations.hatchback55L.dutyGbp} • VAT: £{data.tankCalculations.hatchback55L.vatGbp}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-white font-mono">
                    £{data.tankCalculations.hatchback55L.totalCostGbp.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Save £{data.tankCalculations.hatchback55L.supermarketSavingGbp} at Asda/Tesco
                  </div>
                </div>
              </div>

              {/* 80L Van */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">80L Commercial Van (Ford Transit)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Duty: £{data.tankCalculations.largeSuvVan80L.dutyGbp} • VAT: £{data.tankCalculations.largeSuvVan80L.vatGbp}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-white font-mono">
                    £{data.tankCalculations.largeSuvVan80L.totalCostGbp.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Save £{data.tankCalculations.largeSuvVan80L.supermarketSavingGbp} at Supermarket
                  </div>
                </div>
              </div>

              {/* 400L HGV */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">400L Commercial HGV (Articulated Lorry)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Duty: £{data.tankCalculations.hgv400L.dutyGbp} • VAT: £{data.tankCalculations.hgv400L.vatGbp}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-amber-300 font-mono">
                    £{data.tankCalculations.hgv400L.totalCostGbp.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-rose-400">
                    MSA penalty: +£{data.tankCalculations.hgv400L.motorwayPremiumGbp}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Supermarket forecourts save between £2.64 and £19.20 per tank vs national average.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 30-Day UK Price Trend Chart (Interactive SVG) */}
      {data && data.history.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span>UK 30-Day {selectedFuel === 'petrol' ? 'Petrol' : 'Diesel'} &amp; Brent Crude Trend (Pence per Litre)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Tracking UK National Average vs Supermarkets vs Motorway Service Areas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span>UK National</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Supermarkets (-4.8p)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span>Motorway MSAs (+27.5p)</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span>Wholesale Delivered</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="h-48 w-full pt-2">
            {(() => {
              const pts = data.history;
              if (pts.length < 2) return null;
              const allValues = pts.flatMap((p) => [p.nationalPumpPence, p.supermarketPumpPence, p.motorwayPumpPence, p.wholesalePence]);
              const minP = Math.min(...allValues) - 2;
              const maxP = Math.max(...allValues) + 2;
              const range = maxP - minP || 1;

              const svgWidth = 900;
              const svgHeight = 160;
              const padX = 20;
              const padY = 15;

              const getX = (idx: number) => padX + (idx / (pts.length - 1)) * (svgWidth - padX * 2);
              const getY = (val: number) => svgHeight - padY - ((val - minP) / range) * (svgHeight - padY * 2);

              const makePath = (key: 'nationalPumpPence' | 'supermarketPumpPence' | 'motorwayPumpPence' | 'wholesalePence') => {
                return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p[key]).toFixed(1)}`).join(' ');
              };

              return (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="#27272a" strokeDasharray="3 3" />
                  <line x1={padX} y1={svgHeight / 2} x2={svgWidth - padX} y2={svgHeight / 2} stroke="#27272a" strokeDasharray="3 3" />
                  <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#27272a" strokeDasharray="3 3" />

                  {/* Motorway Line */}
                  <path d={makePath('motorwayPumpPence')} fill="none" stroke="#fb7185" strokeWidth="2" strokeDasharray="4 2" />
                  {/* UK National Line */}
                  <path d={makePath('nationalPumpPence')} fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                  {/* Supermarket Line */}
                  <path d={makePath('supermarketPumpPence')} fill="none" stroke="#34d399" strokeWidth="2" />
                  {/* Wholesale Line */}
                  <path d={makePath('wholesalePence')} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 2" />

                  {/* Points on National line */}
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={getX(i)}
                      cy={getY(p.nationalPumpPence)}
                      r="3.5"
                      className="fill-amber-400 hover:r-5 transition-all cursor-pointer"
                    >
                      <title>{`${p.date}: National ${p.nationalPumpPence}p/L | Supermarkets ${p.supermarketPumpPence}p/L | Motorway ${p.motorwayPumpPence}p/L`}</title>
                    </circle>
                  ))}
                </svg>
              );
            })()}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-800">
            <span>{data.history[0]?.date || '30 days ago'}</span>
            <span>Historical 30-Day Platts &amp; UK Pump Tracking</span>
            <span>{data.history[data.history.length - 1]?.date || 'Today'}</span>
          </div>
        </div>
      )}

      {/* Main Exploration Tables: UK Forecourts, Regions, Supermarkets, & Grades */}
      <div className="space-y-4">
        {/* Navigation Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All UK Forecourts & Chains' },
              { id: 'supermarkets', label: 'Supermarkets (Asda/Tesco)' },
              { id: 'regions', label: 'UK Nations & Regions' },
              { id: 'motorways', label: 'Motorway Services (MSAs)' },
              { id: 'branded', label: 'Oil Majors (BP/Shell/Esso)' },
              { id: 'grades', label: selectedFuel === 'petrol' ? 'Petrol Grades & Super Unleaded' : 'Diesel Grades & Commercial' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search forecourt or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-48 sm:w-56"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="price_asc">Cheapest First</option>
              <option value="price_desc">Most Expensive First</option>
              <option value="spread">Spread vs National</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* View 1: UK Retail Forecourt Chains (Supermarkets, Motorways, Oil Majors) */}
        {activeTab !== 'regions' && activeTab !== 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRetailers.map((r) => {
              const diffVsNational = Number((r.pricePence - (m?.ukNationalAveragePence || 160.8)).toFixed(1));
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-4 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{r.name}</h4>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                              r.category === 'supermarket'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : r.category === 'motorway'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {r.category.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                          ~{r.forecourtsCount} UK Forecourts
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-white font-mono">
                          {formatDisplayPrice(r.pricePence)}
                        </div>
                        <div
                          className={`text-[11px] font-medium font-mono ${
                            diffVsNational < 0 ? 'text-emerald-400' : diffVsNational > 0 ? 'text-rose-400' : 'text-zinc-400'
                          }`}
                        >
                          {diffVsNational <= 0 ? `${diffVsNational}p/L vs Nat` : `+${diffVsNational}p/L vs Nat`}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Loyalty Program:</span>
                      <span className="text-zinc-300 font-semibold">{r.loyaltyProgram}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.amenities.map((a, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-800"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: UK Nations & Administrative Regions */}
        {activeTab === 'regions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map((reg) => (
              <div
                key={reg.id}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-4 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{reg.name}</h4>
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                          {reg.regionCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 capitalize">{reg.category}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-white font-mono">
                        {formatDisplayPrice(reg.pricePence)}
                      </div>
                      <div
                        className={`text-[11px] font-medium font-mono ${
                          reg.spreadVsNational < 0
                            ? 'text-emerald-400'
                            : reg.spreadVsNational > 0
                            ? 'text-rose-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {reg.spreadVsNational <= 0 ? `${reg.spreadVsNational}p vs Nat` : `+${reg.spreadVsNational}p vs Nat`}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {reg.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <span>Duty Included: {reg.fuelDutyPence}p/L</span>
                  <span className="font-mono text-zinc-300">£{(reg.pricePence / 100).toFixed(3)}/L</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View 3: Diesel Grades & Commercial Fuels (B7, Premium, HVO, Red Diesel, AdBlue) */}
        {activeTab === 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrades.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-4 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{g.name}</h4>
                      <div className="text-[11px] text-amber-400 font-mono mt-0.5">{g.standard}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-white font-mono">
                        {formatDisplayPrice(g.pricePence)}
                      </div>
                      {g.cetaneNumber > 0 && (
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {selectedFuel === 'petrol' ? `RON Octane: ${g.cetaneNumber}` : `Cetane: ${g.cetaneNumber}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Statutory Duty:</span>
                    <span className="font-mono text-zinc-200">{g.dutyPence}p / L</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Availability:</span>
                    <span className="text-zinc-300 text-[11px] truncate max-w-[180px]">{g.availability}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Disclaimer & Regulatory Citations */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-zinc-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>UK Fuel Standards &amp; Regulatory Benchmark Framework</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Wholesale benchmarks track ICE Brent crude oil and Platts ARA Gasoil delivered to Thames, Fawley, Stanlow, and Teesside oil terminals. Retail pricing model conforms to the Competition and Markets Authority (CMA) road fuel market study and the Department for Energy Security and Net Zero (DESNZ) weekly fuel price series. All forecourt standard diesel complies with British Standard BS EN 590 (max 7% FAME biofuel). Statutory UK fuel duty is 52.95p per litre with standard 20% VAT applied to the subtotal.
        </p>
      </div>
    </div>
  );
};
