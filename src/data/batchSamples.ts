export interface BatchSample {
  id: string;
  name: string;
  format: 'csv' | 'jsonl';
  description: string;
  prompt: string;
  mode: 'scale' | 'discrete' | 'threshold';
  numbers: string[];
  thresholdStatement?: string;
  content: string;
}

export const BATCH_SAMPLES: BatchSample[] = [
  {
    id: 'customer-nps-csv',
    name: 'Customer NPS Feed (CSV)',
    format: 'csv',
    description: '10 enterprise customer accounts with telemetry and support ticket data.',
    prompt: 'Predict the customer NPS rating number on scale 1 to 10',
    mode: 'scale',
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    content: `customer_id,tier,days_active,support_tickets,reported_bugs,user_sentiment
CUST-101,Enterprise,120,0,0,"Extremely satisfied with sub-100ms API response times"
CUST-102,Growth,45,2,1,"Experienced brief timeout during peak load on Tuesday"
CUST-103,Enterprise,310,0,0,"Seamless integration, onboarding engineer was stellar"
CUST-104,Starter,12,4,2,"Confused by authentication token renewal workflow"
CUST-105,Enterprise,180,1,0,"Low latency is unmatched, looking to upgrade plan tier"
CUST-106,Growth,90,0,0,"Solid documentation and reliable typed outputs"
CUST-107,Starter,5,3,1,"First week using Jev, struggling with question schema"
CUST-108,Enterprise,420,0,0,"Mission-critical production workload running flawlessly"
CUST-109,Growth,65,1,0,"Support resolved issue within 15 minutes, very impressed"
CUST-110,Enterprise,240,2,0,"Great performance overall, waiting on Python SDK 3.12 tag"`
  },
  {
    id: 'sensor-telemetry-csv',
    name: 'Sensor Telemetry (CSV)',
    format: 'csv',
    description: '8 sensor reading telemetry sequences predicting next single-digit modulo reading.',
    prompt: 'Predict the most probable single-digit number (0-9)',
    mode: 'scale',
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    content: `sensor_id,milli_volts,frequency_hz,ambient_temp_c,vibration_delta,trend
SNS-01,480,60.2,24.5,0.02,"Upward sinusoidal pulse"
SNS-02,310,59.8,28.1,0.11,"Damped harmonic decay"
SNS-03,890,60.0,22.0,0.01,"Stable linear plateau"
SNS-04,150,58.9,35.4,0.45,"High-frequency thermal jitter"
SNS-05,720,60.1,23.8,0.04,"Periodic step function"
SNS-06,540,60.0,24.1,0.02,"Equilibrium steady-state"
SNS-07,260,59.5,31.2,0.18,"Transient voltage sag"
SNS-08,980,60.3,21.9,0.01,"Peak operational baseline"`
  },
  {
    id: 'fraud-risk-deciles-csv',
    name: 'Transaction Risk Deciles (CSV)',
    format: 'csv',
    description: '7 high-velocity financial transactions evaluating risk decile buckets.',
    prompt: 'Evaluate transaction risk score decile',
    mode: 'scale',
    numbers: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
    content: `txn_id,amount_usd,merchant_category,card_present,ip_distance_km,velocity_1h
TX-901,45.50,groceries,true,1.2,1
TX-902,4850.00,crypto_exchange,false,3400.0,7
TX-903,120.00,electronics,true,5.4,2
TX-904,9200.00,luxury_jewelry,false,820.0,5
TX-905,14.99,streaming_subscription,false,0.0,1
TX-906,2300.00,wire_transfer,false,1450.0,4
TX-907,32.00,gas_station,true,3.1,1`
  },
  {
    id: 'cluster-threshold-jsonl',
    name: 'Cluster Load Thresholds (JSONL)',
    format: 'jsonl',
    description: '6 infrastructure cluster states evaluated against peak capacity threshold.',
    prompt: 'Evaluate cluster threshold state',
    mode: 'threshold',
    numbers: ['No', 'Yes'],
    thresholdStatement: 'Will cluster CPU or memory utilization exceed 85% in the next 15 minutes?',
    content: `{"cluster_id": "prod-us-east-1", "cpu_pct": 88.5, "mem_pct": 91.2, "qps": 8400, "pod_replicas": 32}
{"cluster_id": "prod-eu-west-1", "cpu_pct": 42.1, "mem_pct": 53.0, "qps": 2100, "pod_replicas": 16}
{"cluster_id": "prod-ap-northeast-1", "cpu_pct": 79.4, "mem_pct": 82.8, "qps": 6200, "pod_replicas": 24}
{"cluster_id": "staging-us-central-1", "cpu_pct": 18.2, "mem_pct": 24.5, "qps": 350, "pod_replicas": 4}
{"cluster_id": "prod-sa-east-1", "cpu_pct": 65.0, "mem_pct": 71.3, "qps": 3900, "pod_replicas": 14}
{"cluster_id": "prod-us-west-2", "cpu_pct": 92.8, "mem_pct": 94.1, "qps": 11500, "pod_replicas": 40}`
  }
];

export interface BatchItemResult {
  id: string;
  rawInput: Record<string, any> | string;
  displaySnippet: string;
  status: 'pending' | 'success' | 'error';
  predictedMode?: string;
  modeProbability?: number;
  expectedValue?: number | null;
  confidence?: number;
  probabilities?: Record<string, number>;
  noulProbability?: number;
  latencyMs?: number;
  errorMessage?: string;
}

export function parseBatchInput(text: string): { items: Array<{ id: string; state: any; displaySnippet: string }>; format: 'csv' | 'jsonl' | 'lines' } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { items: [], format: 'lines' };
  }

  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { items: [], format: 'lines' };
  }

  // Check if first line starts with '{' -> JSON Lines (NDJSON)
  if (lines[0].trim().startsWith('{')) {
    const items = lines.map((line, idx) => {
      try {
        const parsed = JSON.parse(line);
        const id = parsed.id || parsed.customer_id || parsed.txn_id || parsed.sensor_id || parsed.cluster_id || `item_${idx + 1}`;
        const displaySnippet = Object.entries(parsed)
          .filter(([k]) => k !== 'id')
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        return { id: String(id), state: parsed, displaySnippet };
      } catch {
        return { id: `item_${idx + 1}`, state: line, displaySnippet: line.slice(0, 60) };
      }
    });
    return { items, format: 'jsonl' };
  }

  // Check if CSV (contains comma in first line)
  if (lines[0].includes(',')) {
    // Simple CSV parser handling quotes
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^["']|["']$/g, ''));
    };

    const headers = parseCSVLine(lines[0]);
    const items = lines.slice(1).map((line, idx) => {
      const values = parseCSVLine(line);
      const rowObj: Record<string, any> = {};
      headers.forEach((h, hIdx) => {
        let val: any = values[hIdx] !== undefined ? values[hIdx] : '';
        // Parse numbers if strictly numeric
        if (val !== '' && !isNaN(Number(val))) {
          val = Number(val);
        }
        rowObj[h] = val;
      });

      const id = rowObj.id || rowObj.customer_id || rowObj.txn_id || rowObj.sensor_id || rowObj.cluster_id || `row_${idx + 1}`;
      const displaySnippet = Object.entries(rowObj)
        .filter(([k]) => !k.toLowerCase().includes('id'))
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      return { id: String(id), state: rowObj, displaySnippet };
    });

    return { items, format: 'csv' };
  }

  // Fallback: Plain text newline-separated lines
  const items = lines.map((line, idx) => ({
    id: `line_${idx + 1}`,
    state: { text: line },
    displaySnippet: line.slice(0, 60)
  }));
  return { items, format: 'lines' };
}
