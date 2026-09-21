import { PresetScenario, Question, EvaluationResult, QuestionResult } from '../types';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'support-ticket',
    title: 'Customer Support Triage',
    description: 'Classify incoming customer inquiry, evaluate urgency, and determine immediate escalation.',
    iconName: 'LifeBuoy',
    state: JSON.stringify(
      {
        ticket_id: 'TCK-8921',
        customer_tier: 'Enterprise Platinum',
        subject: 'URGENT: SSO SAML integration broken after IdP certificate rollover',
        body: 'None of our 450 engineering staff can log in today following our Okta cert refresh. We are blocked from deploying our release candidate. Need urgent support engineer call immediately.',
        submitted_at: '2026-09-21T08:14:22Z',
        channel: 'email'
      },
      null,
      2
    ),
    questions: [
      {
        type: 'choice',
        id: 'department',
        name: 'department',
        prompt: 'Which internal engineering or operations department should handle this ticket?',
        options: ['identity-access', 'billing-invoicing', 'core-infrastructure', 'hardware-support', 'general-inquiry']
      },
      {
        type: 'score',
        id: 'urgency_level',
        name: 'urgency_level',
        prompt: 'Assess the business urgency and severity level of this incident',
        levels: ['P4-Low', 'P3-Normal', 'P2-High', 'P1-Critical', 'P0-Outage']
      },
      {
        type: 'noul',
        id: 'needs_executive_escalation',
        name: 'needs_executive_escalation',
        statement: 'This ticket warrants immediate page of the on-call executive or incident commander.'
      }
    ]
  },
  {
    id: 'security-telemetry',
    title: 'Security Telemetry & Threat Filter',
    description: 'Real-time asynchronous evaluation of suspicious network event logs and automated firewall action.',
    iconName: 'ShieldAlert',
    state: JSON.stringify(
      {
        source_ip: '198.51.100.44',
        user_agent: 'curl/7.88.1 (x86_64-pc-linux-gnu)',
        endpoint: '/api/v2/admin/credentials/dump',
        method: 'POST',
        headers: {
          'X-Forwarded-For': '203.0.113.195',
          'Authorization': 'Bearer test_eyJhbGciOiJIUzI1Ni...'
        },
        payload_entropy: 7.94,
        geo_country: 'RO',
        failed_attempts_in_5m: 142
      },
      null,
      2
    ),
    questions: [
      {
        type: 'choice',
        id: 'attack_vector',
        name: 'attack_vector',
        prompt: 'Identify the primary attack pattern represented in this request telemetry',
        options: ['credential-stuffing', 'path-traversal', 'admin-privilege-escalation', 'benign-synthetic-test', 'sql-injection']
      },
      {
        type: 'score',
        id: 'threat_severity',
        name: 'threat_severity',
        prompt: 'Threat score on ordered risk scale',
        levels: ['negligible', 'suspicious', 'elevated', 'critical-exploit']
      },
      {
        type: 'noul',
        id: 'immediate_ip_ban',
        name: 'immediate_ip_ban',
        statement: 'The automated WAF should apply an immediate 24-hour rate ban on this source IP.'
      }
    ]
  },
  {
    id: 'pull-request-guard',
    title: 'Code Review & PR Risk Guard',
    description: 'System One pre-merge evaluation for automated CI pipelines and pull request safety.',
    iconName: 'GitPullRequest',
    state: JSON.stringify(
      {
        pr_number: 1409,
        author: 'j-dev-external',
        repo: 'acme/billing-service',
        files_modified: ['src/payments/stripe_webhook.py', 'src/db/migrations/0042_charge_tokens.sql'],
        additions: 184,
        deletions: 12,
        diff_summary: 'Removed signature check retry limit and updated Stripe secret key fallback logic in production config.'
      },
      null,
      2
    ),
    questions: [
      {
        type: 'choice',
        id: 'pr_category',
        name: 'pr_category',
        prompt: 'Primary functional domain of this code change',
        options: ['payment-security', 'documentation', 'frontend-ui', 'performance-optimization', 'developer-tooling']
      },
      {
        type: 'score',
        id: 'deployment_risk',
        name: 'deployment_risk',
        prompt: 'Risk score for automated deployment without manual audit',
        levels: ['trivial', 'low', 'moderate', 'high-risk', 'fatal-security-hazard']
      },
      {
        type: 'noul',
        id: 'require_security_signoff',
        name: 'require_security_signoff',
        statement: 'This pull request modifies critical cryptographic or financial code paths requiring SecOps sign-off.'
      }
    ]
  }
];

export function simulateSystemOneEvaluation(stateStr: string, questions: Question[]): Record<string, QuestionResult> {
  const lower = stateStr.toLowerCase();
  const results: Record<string, QuestionResult> = {};

  for (const q of questions) {
    if (q.type === 'choice') {
      let selectedOption = q.options[0];
      const probs: Record<string, number> = {};

      if (q.id === 'department') {
        if (lower.includes('saml') || lower.includes('okta') || lower.includes('login') || lower.includes('sso')) {
          selectedOption = 'identity-access';
        } else if (lower.includes('billing') || lower.includes('invoice') || lower.includes('credit')) {
          selectedOption = 'billing-invoicing';
        } else if (lower.includes('hardware') || lower.includes('screen') || lower.includes('cable')) {
          selectedOption = 'hardware-support';
        } else {
          selectedOption = q.options[0];
        }
      } else if (q.id === 'attack_vector') {
        if (lower.includes('credential') || lower.includes('dump') || lower.includes('admin')) {
          selectedOption = 'admin-privilege-escalation';
        } else if (lower.includes('failed_attempts')) {
          selectedOption = 'credential-stuffing';
        } else {
          selectedOption = q.options[0];
        }
      } else if (q.id === 'pr_category') {
        if (lower.includes('stripe') || lower.includes('payment') || lower.includes('charge')) {
          selectedOption = 'payment-security';
        } else {
          selectedOption = q.options[0];
        }
      } else {
        // Fallback matching
        for (const opt of q.options) {
          if (lower.includes(opt.toLowerCase())) {
            selectedOption = opt;
            break;
          }
        }
      }

      // Generate calibrated probabilities
      let remaining = 1.0;
      const topProb = 0.82 + Math.random() * 0.12;
      probs[selectedOption] = parseFloat(topProb.toFixed(3));
      remaining -= probs[selectedOption];

      const otherOpts = q.options.filter(o => o !== selectedOption);
      otherOpts.forEach((opt, idx) => {
        if (idx === otherOpts.length - 1) {
          probs[opt] = parseFloat(Math.max(0.005, remaining).toFixed(3));
        } else {
          const share = parseFloat((remaining * (0.3 + Math.random() * 0.4)).toFixed(3));
          probs[opt] = Math.max(0.005, share);
          remaining = Math.max(0.005, remaining - share);
        }
      });

      results[q.name] = {
        type: 'choice',
        choice: selectedOption,
        probabilities: probs,
        confidence: parseFloat((0.88 + Math.random() * 0.1).toFixed(2))
      };
    } else if (q.type === 'score') {
      let chosenIdx = Math.floor(q.levels.length / 2);
      if (lower.includes('urgent') || lower.includes('outage') || lower.includes('blocked') || lower.includes('exploit') || lower.includes('fatal')) {
        chosenIdx = Math.min(q.levels.length - 1, q.levels.length - 2 + Math.round(Math.random()));
      } else if (lower.includes('low') || lower.includes('trivial') || lower.includes('docs')) {
        chosenIdx = 0;
      }

      const chosenLevel = q.levels[chosenIdx];
      const probs: Record<string, number> = {};
      q.levels.forEach((lvl, idx) => {
        const distance = Math.abs(idx - chosenIdx);
        if (distance === 0) {
          probs[lvl] = 0.75 + Math.random() * 0.15;
        } else if (distance === 1) {
          probs[lvl] = 0.15 * Math.random();
        } else {
          probs[lvl] = 0.02 * Math.random();
        }
      });

      // Normalize
      const total = Object.values(probs).reduce((a, b) => a + b, 0);
      Object.keys(probs).forEach(k => {
        probs[k] = parseFloat((probs[k] / total).toFixed(3));
      });

      results[q.name] = {
        type: 'score',
        score: chosenLevel,
        levelIndex: chosenIdx,
        totalLevels: q.levels.length,
        probabilities: probs,
        confidence: parseFloat((0.85 + Math.random() * 0.12).toFixed(2))
      };
    } else if (q.type === 'noul') {
      let prob = 0.45;
      if (lower.includes('urgent') || lower.includes('blocked') || lower.includes('dump') || lower.includes('attack') || lower.includes('security')) {
        prob = 0.94 + Math.random() * 0.05;
      } else if (lower.includes('test') || lower.includes('docs') || lower.includes('minor')) {
        prob = 0.08 + Math.random() * 0.06;
      }

      results[q.name] = {
        type: 'noul',
        probability: parseFloat(prob.toFixed(3)),
        boolean: prob >= 0.5
      };
    }
  }

  return results;
}
