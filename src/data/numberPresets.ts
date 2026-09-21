export interface NumberPreset {
  id: string;
  title: string;
  description: string;
  mode: 'scale' | 'discrete' | 'threshold';
  state: string;
  prompt: string;
  numbers: string[];
  thresholdStatement?: string;
  domain: string;
}

export const NUMBER_PRESETS: NumberPreset[] = [
  {
    id: 'nps-satisfaction',
    title: 'Customer NPS Rating (1 to 10)',
    description: 'Predict probability distribution of customer satisfaction rating numbers from 1 to 10.',
    mode: 'scale',
    domain: 'Customer Experience',
    state: JSON.stringify(
      {
        customer_tier: 'Enterprise',
        recent_onboarding_call: 'Went smoothly, client engineer praised the low latency API documentation.',
        reported_bugs: 0,
        support_tickets_opened: 1,
        days_active: 45,
        daily_query_volume: 12500
      },
      null,
      2
    ),
    prompt: 'Predict the customer NPS rating number on scale 1 to 10',
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  {
    id: 'single-digits',
    title: 'Single Digit Predictor (0 to 9)',
    description: 'Evaluate probability of each digit 0 through 9 based on contextual telemetry sequence.',
    mode: 'scale',
    domain: 'Telemetry & Sequence',
    state: JSON.stringify(
      {
        sequence_prefix: [2, 4, 6, 8],
        trend: 'arithmetic progression with cyclical decay',
        sensor_reading_mv: 412,
        noise_level: 'low',
        signal_target: 'next modulo 10 digit'
      },
      null,
      2
    ),
    prompt: 'Predict the most probable digit number 0 through 9',
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  },
  {
    id: 'risk-deciles',
    title: 'Risk Deciles (0-10% to 90-100%)',
    description: 'Predict numerical risk probability bucket for high-frequency financial transaction.',
    mode: 'scale',
    domain: 'Financial Risk',
    state: JSON.stringify(
      {
        transaction_amount_usd: 4850.0,
        merchant_category: 'crypto_onramp',
        card_present: false,
        device_fingerprint_match: true,
        ip_velocity_1h: 3,
        distance_from_billing_address_km: 12.4
      },
      null,
      2
    ),
    prompt: 'Evaluate transaction risk score decile',
    numbers: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%']
  },
  {
    id: 'discrete-lottery',
    title: 'Discrete Number Selector',
    description: 'Predict probability across specific non-sequential numbers (e.g., key metrics or lottery balls).',
    mode: 'discrete',
    domain: 'Discrete Modeling',
    state: JSON.stringify(
      {
        experiment_id: 'RND-77',
        target_group: 'prime_cluster',
        observed_entropy: 0.92,
        eligible_candidates: [7, 13, 23, 41, 67, 89]
      },
      null,
      2
    ),
    prompt: 'Select the candidate number with highest probabilistic likelihood',
    numbers: ['7', '13', '23', '41', '67', '89']
  },
  {
    id: 'threshold-probability',
    title: 'Numerical Threshold (> 50, > 80)',
    description: 'Predict exact scalar probability that a number exceeds critical operational thresholds.',
    mode: 'threshold',
    domain: 'Threshold Analysis',
    state: JSON.stringify(
      {
        cluster_cpu_utilization: 78.4,
        memory_usage_pct: 86.1,
        incoming_request_rate_rps: 4200,
        pod_count: 12,
        autoscaler_max_pods: 16
      },
      null,
      2
    ),
    prompt: 'Probability of cluster load exceeding thresholds',
    numbers: ['Threshold > 50%', 'Threshold > 80%', 'Threshold > 95%'],
    thresholdStatement: 'Will peak cluster utilization exceed the 90% threshold in the next 15 minutes?'
  }
];

export function calculateStatistics(probabilities: Record<string, number>): {
  expectedValue: number | null;
  mode: string;
  modeProb: number;
  stdDev: number | null;
} {
  const entries = Object.entries(probabilities);
  if (entries.length === 0) {
    return { expectedValue: null, mode: '', modeProb: 0, stdDev: null };
  }

  // Find Mode
  let mode = entries[0][0];
  let modeProb = entries[0][1];
  for (const [key, prob] of entries) {
    if (prob > modeProb) {
      mode = key;
      modeProb = prob;
    }
  }

  // Check if keys are pure numbers for expected value
  const allNumeric = entries.every(([k]) => !isNaN(Number(k)));
  if (!allNumeric) {
    return { expectedValue: null, mode, modeProb, stdDev: null };
  }

  let ev = 0;
  let ev2 = 0;
  for (const [k, p] of entries) {
    const num = Number(k);
    ev += num * p;
    ev2 += num * num * p;
  }

  const variance = Math.max(0, ev2 - ev * ev);
  const stdDev = Math.sqrt(variance);

  return {
    expectedValue: parseFloat(ev.toFixed(2)),
    mode,
    modeProb,
    stdDev: parseFloat(stdDev.toFixed(2))
  };
}
