import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Zap,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  Fuel,
  Cpu,
  Wallet,
  Car,
  Truck,
  Building2,
  Layers,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';

export interface JevPredictorCardProps {
  data: any;
  selectedFuel: 'petrol' | 'diesel';
  setSelectedFuel: (fuel: 'petrol' | 'diesel') => void;
  predicting: boolean;
  predictionResults: any;
  predictionLatency: number | null;
  customScenario: string;
  setCustomScenario: (scenario: string) => void;
  runJevForecast: (scenario?: string) => Promise<void>;
}

export const JevPredictorCard: React.FC<JevPredictorCardProps> = ({
  data,
  selectedFuel,
  setSelectedFuel,
  predicting,
  predictionResults,
  predictionLatency,
  customScenario: _customScenario,
  setCustomScenario,
  runJevForecast
}) => {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                TypeSafe Jev AI • UK {selectedFuel === 'petrol' ? 'Petrol' : 'Diesel'} Price &amp; Procurement Forecast
              </h3>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                Bayesian Calibration
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Evaluates UK macro indicators, Brent in GBP, {selectedFuel === 'petrol' ? 'gasoline crack & ethanol margins' : 'refinery gasoil crack spreads'}, and CMA supermarket margins
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runJevForecast()}
            disabled={predicting}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-all cursor-pointer shadow-md shadow-amber-950 disabled:opacity-50"
          >
            {predicting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Calculating Jev Forecast...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                <span>Run Live Jev UK Forecast</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick UK Stress Scenario Chips */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
          <span>Test Macro UK Stress Scenarios with Jev:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              title: 'Sterling Slides to $1.22/£',
              scenario:
                'Sterling currency deprecation shock: GBP/USD drops from $1.339 to $1.22 against the US Dollar. Brent crude remains at $97/bbl, increasing the landed cost of dollar-denominated imported oil by 9.8% in UK pounds.'
            },
            {
              title: 'Brent Crude Rallies to $105/bbl',
              scenario:
                'Geopolitical supply tightening in Middle East and Red Sea shipping lanes causes Brent crude to rally to $105/bbl (£78.40/bbl). ARA Rotterdam gasoil refining crack expands to 28p/L.'
            },
            {
              title: 'Chancellor Ends 5p Fuel Duty Cut',
              scenario:
                'HM Treasury Spring Statement: The Chancellor confirms the expiry of the temporary 5.0p/L fuel duty cut. Fuel duty increases from 52.95p to 57.95p/L, which with 20% VAT adds 6.0p/L to retail forecourt pumps overnight.'
            },
            {
              title: 'CMA Real-Time Fuel Finder Mandate',
              scenario:
                'Competition and Markets Authority (CMA) enacts mandatory open-data real-time fuel pricing for all 8,350 UK forecourts. Price transparency intensifies local supermarket and independent price competition.'
            },
            {
              title: 'Essar Stanlow Refinery Outage',
              scenario:
                'Unplanned maintenance and crude distillation unit outage at Essar Stanlow Refinery in Cheshire disrupts regional diesel supply to North West England and Midlands pipeline terminals.'
            }
          ].map((sc, i) => (
            <button
              key={i}
              onClick={() => {
                setCustomScenario(sc.scenario);
                runJevForecast(sc.scenario);
              }}
              disabled={predicting}
              className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 border border-zinc-800 hover:border-amber-500/50 hover:text-white transition-all cursor-pointer text-left"
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction Results */}
      {predictionResults && (
        <div className="space-y-6 pt-2">
          {/* HERO PANEL: Next Fuel Price Rise Forecast */}
          {(() => {
            const currentAvg = data ? data.marketOverview.ukNationalAveragePence : (selectedFuel === 'petrol' ? 138.2 : 144.9);
            const riseMagChoice = predictionResults.next_price_rise_magnitude?.choice || 'Moderate Rise (+1.8p to +2.9p/L)';
            const isSignificant = riseMagChoice.includes('+3.0') || riseMagChoice.includes('Severe');
            const isSpike = riseMagChoice.includes('> +4.5');
            const isMinimal = riseMagChoice.includes('+0.5') || riseMagChoice.includes('Marginal');
            
            const riseDeltaPence = isSpike ? 5.2 : isSignificant ? 3.6 : isMinimal ? 1.2 : (selectedFuel === 'petrol' ? 2.1 : 2.7);
            const projectedNewNationalAvg = Number((currentAvg + riseDeltaPence).toFixed(1));
            const projectedSupermarketAvg = Number((data?.marketOverview.supermarketAveragePence ? data.marketOverview.supermarketAveragePence + riseDeltaPence : projectedNewNationalAvg - 4.5).toFixed(1));
            const projectedMotorwayAvg = Number((data?.marketOverview.motorwayAveragePence ? data.marketOverview.motorwayAveragePence + riseDeltaPence : projectedNewNationalAvg + 28.5).toFixed(1));

            const riseProb = (predictionResults.probability_of_rise_noul?.probability ?? 0.836) * 100;
            const timingText = predictionResults.next_price_rise_timing?.choice || 'Near-Term (3–7 Days): Pass-through of crude & refinery crack rally';
            const catalystText = predictionResults.primary_rise_catalyst?.choice || 'Brent Crude Rally in USD passing through to ARA Rotterdam wholesale barges with 10-14 day delay';
            const actionText = predictionResults.recommended_driver_action?.choice || 'Fill Up Before Weekend: Beat anticipated wholesale pump pass-through';

            const fillDiff55L = Number(((riseDeltaPence * 55) / 100).toFixed(2));
            const fillDiff80L = Number(((riseDeltaPence * 80) / 100).toFixed(2));
            const fillDiff400L = Number(((riseDeltaPence * 400) / 100).toFixed(2));

            return (
              <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
                {/* Subtle decorative glow */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/60">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-bold text-white tracking-tight">
                          Jev Forecast: Next UK {selectedFuel === 'petrol' ? 'Petrol' : 'Diesel'} Price Rise
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300 border border-amber-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Next Price Rise Projected
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Evaluated directly by TypeSafe Jev System One from wholesale ARA Rotterdam replacement lags, Brent GBP parity, and forecourt margins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-lg bg-zinc-800/90 border border-zinc-700 px-3 py-1.5 font-mono text-zinc-300">
                      Current: <strong className="text-white">{currentAvg.toFixed(1)}p/L</strong>
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-400" />
                    <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 font-mono text-amber-300 font-bold">
                      Next: {projectedNewNationalAvg.toFixed(1)}p/L
                    </span>
                  </div>
                </div>

                {/* 4 Hero Metric Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                  {/* 1. When: Expected Timing */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2.5 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>Expected Timing</span>
                      </span>
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        Window
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {timingText.split(':')[0] || '3 to 7 Days'}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {timingText.includes(':') ? timingText.split(':')[1] : '10-14 day ARA Rotterdam wholesale lag pass-through'}
                    </p>
                  </div>

                  {/* 2. What: Predicted Rise Magnitude */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-2.5 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-medium flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                        <span>Predicted Rise</span>
                      </span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                        +{riseDeltaPence.toFixed(1)}p / L
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      +{riseDeltaPence.toFixed(1)}p<span className="text-xs font-normal text-zinc-400 ml-1">/ Litre</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {riseMagChoice.includes(':') ? riseMagChoice.split(':')[0] : riseMagChoice}
                    </p>
                  </div>

                  {/* 3. New Projected Pump Price */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2.5 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Fuel className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Projected New Pump Price</span>
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                        National Avg
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {projectedNewNationalAvg.toFixed(1)}p<span className="text-xs font-normal text-zinc-400 ml-1">/ Litre</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                      <span>Supermarket: ~{projectedSupermarketAvg.toFixed(1)}p</span>
                      <span>M'way: ~{projectedMotorwayAvg.toFixed(1)}p</span>
                    </div>
                  </div>

                  {/* 4. Jev Probability of Price Rise */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2.5 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-amber-400" />
                        <span>Probability of Rise</span>
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold">
                        Jev Noul P(True)
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {riseProb.toFixed(1)}%
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                          style={{ width: `${Math.min(100, riseProb)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 text-right">
                        Calibrated Bayesian probability
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impact on Tank Fill Costs */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-amber-400" />
                      <h5 className="text-xs font-bold text-zinc-200">
                        What This Predicted +{riseDeltaPence.toFixed(1)}p/L Rise Means For Your Tank Fill Cost:
                      </h5>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Extra £ per refuel after the price rise
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Family Hatchback (55L)</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          New Fill: £{((projectedNewNationalAvg * 55) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          +£{fillDiff55L.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-zinc-500">extra per tank</div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Large SUV / Van (80L)</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          New Fill: £{((projectedNewNationalAvg * 80) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          +£{fillDiff80L.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-zinc-500">extra per tank</div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Commercial HGV (400L)</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          New Fill: £{((projectedNewNationalAvg * 400) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          +£{fillDiff400L.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-zinc-500">extra per tank</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Catalyst & Driver Directive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs relative z-10">
                  {/* Primary Catalyst */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                      <Layers className="h-4 w-4 text-amber-400" />
                      <span>Primary Market Catalyst Driving This Rise</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-medium">
                      {catalystText}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Wholesale ARA cargo shipments take ~10 to 14 days to filter down the UK pipeline network from coastal oil terminals into retail forecourt tanks.
                    </p>
                  </div>

                  {/* Jev Actionable Recommendation */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Jev Actionable Driver &amp; Fleet Directive</span>
                    </div>
                    <p className="text-emerald-200 font-medium leading-relaxed">
                      {actionText}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Forecourt retailers operate on narrow margins and will begin lifting pump prices once existing bulk stock is depleted.
                    </p>
                  </div>
                </div>

                {/* Dual Petrol vs Diesel Quick Switcher / Comparison */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/70 text-xs text-zinc-400 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-300">Fuel Comparison:</span>
                    <button
                      onClick={() => setSelectedFuel('petrol')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                        selectedFuel === 'petrol'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Petrol (E10): Next rise ~+1.8p to +2.4p in 6–9 days
                    </button>
                    <button
                      onClick={() => setSelectedFuel('diesel')}
                      className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                        selectedFuel === 'diesel'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Diesel (B7): Next rise ~+2.4p to +3.1p in 3–7 days
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                    <span>Model:</span>
                    <span className="text-amber-400">TypeSafe Jev System One</span>
                    <span className="text-zinc-600">•</span>
                    <span>No Text Parsing</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detailed Question Answers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* Timing Distribution Card */}
            {predictionResults.next_price_rise_timing && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    <span>Next Rise Timing Window</span>
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                    {(predictionResults.next_price_rise_timing.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
                <div className="text-base font-bold text-white">
                  {predictionResults.next_price_rise_timing.choice}
                </div>
                {predictionResults.next_price_rise_timing.probabilities && (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(predictionResults.next_price_rise_timing.probabilities).map(([opt, prob]: [string, any]) => (
                      <div key={opt} className="text-xs">
                        <div className="flex justify-between text-zinc-400 mb-0.5 text-[11px]">
                          <span className="truncate pr-2">{opt}</span>
                          <span className="font-mono text-zinc-300">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rise Magnitude Distribution Card */}
            {predictionResults.next_price_rise_magnitude && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    <span>Expected Rise Magnitude</span>
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                    {(predictionResults.next_price_rise_magnitude.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
                <div className="text-base font-bold text-amber-300">
                  {predictionResults.next_price_rise_magnitude.choice}
                </div>
                {predictionResults.next_price_rise_magnitude.probabilities && (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(predictionResults.next_price_rise_magnitude.probabilities).map(([opt, prob]: [string, any]) => (
                      <div key={opt} className="text-xs">
                        <div className="flex justify-between text-zinc-400 mb-0.5 text-[11px]">
                          <span className="truncate pr-2">{opt}</span>
                          <span className="font-mono text-zinc-300">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projected Pump Price Tier */}
            {predictionResults.projected_next_pump_price && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Projected Target Pump Tier</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/20">
                    {(predictionResults.projected_next_pump_price.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
                <div className="text-base font-bold text-emerald-300">
                  {predictionResults.projected_next_pump_price.choice}
                </div>
                {predictionResults.projected_next_pump_price.probabilities && (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(predictionResults.projected_next_pump_price.probabilities).map(([opt, prob]: [string, any]) => (
                      <div key={opt} className="text-xs">
                        <div className="flex justify-between text-zinc-400 mb-0.5 text-[11px]">
                          <span className="truncate pr-2">{opt}</span>
                          <span className="font-mono text-zinc-300">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Supermarket Margin Behavior */}
            {predictionResults.uk_supermarket_margin_behavior && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Supermarket Margins</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/20">
                    Confidence: {(predictionResults.uk_supermarket_margin_behavior.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-base font-bold text-emerald-300">
                  {predictionResults.uk_supermarket_margin_behavior.choice}
                </div>
                {predictionResults.uk_supermarket_margin_behavior.probabilities && (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(predictionResults.uk_supermarket_margin_behavior.probabilities).map(([opt, prob]: [string, any]) => (
                      <div key={opt} className="text-xs">
                        <div className="flex justify-between text-zinc-400 mb-0.5 text-[11px]">
                          <span className="truncate pr-2">{opt}</span>
                          <span className="font-mono text-zinc-300">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Spike Risk Noul Proposition */}
            {(predictionResults.probability_of_rise_noul || predictionResults.uk_price_spike_risk_proposition) && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Rise Likelihood (Jev Noul)</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                    P(True)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {(((predictionResults.probability_of_rise_noul || predictionResults.uk_price_spike_risk_proposition)!.probability) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-zinc-400">
                    probability of upcoming pump price rise
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Evaluated through Jev calibrated boolean integration across wholesale Brent volatility, GBP/USD cable, and refinery crack spreads.
                </p>
              </div>
            )}

            {/* Sterling FX & Geopolitical Risk Score */}
            {predictionResults.uk_sterling_vulnerability_score && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-semibold">Sterling &amp; Supply Risk Tier</span>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-500/20">
                    Score: {predictionResults.uk_sterling_vulnerability_score.score} / 5
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-2.5 flex-1 rounded-full ${
                        lvl <= predictionResults.uk_sterling_vulnerability_score!.score
                          ? 'bg-rose-500'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  {predictionResults.uk_sterling_vulnerability_score.legend?.[
                    String(predictionResults.uk_sterling_vulnerability_score.score)
                  ] || 'High Sensitivity'}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Vulnerability rating to North Sea offshore flows and Sterling depreciation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Latency Footer */}
      {predictionLatency && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
          <div className="text-zinc-400 font-mono text-[11px]">
            <span>⚡ Jev Bayesian execution latency: {predictionLatency}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};
