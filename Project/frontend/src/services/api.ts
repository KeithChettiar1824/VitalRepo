import type {
  FullRepoAnalysis,
  SimulationResult,
  AISimulationExplanation,
  AIHealthExplanation,
  SystemHealth
} from '../types';

const API_BASE = '/api';

export async function analyzeRepository(url: string, periodDays: number = 90): Promise<FullRepoAnalysis> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, period_days: periodDays })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Unknown error occurred' }));
    throw new Error(errData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchDemoAnalysis(): Promise<FullRepoAnalysis> {
  const res = await fetch(`${API_BASE}/demo`);
  if (!res.ok) {
    throw new Error('Failed to load demo repository analysis.');
  }
  return res.json();
}

export async function runSimulation(
  contributorLogin: string,
  scenarioDays: number,
  capacityReductionPercent: number,
  repoContext?: FullRepoAnalysis
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contributor_login: contributorLogin,
      scenario_days: scenarioDays,
      capacity_reduction_percent: capacityReductionPercent,
      repo_context: repoContext
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation failed' }));
    throw new Error(err.detail || 'Failed to execute risk simulation');
  }

  return res.json();
}

export async function explainSimulationWithAI(simResult: SimulationResult): Promise<AISimulationExplanation> {
  const res = await fetch(`${API_BASE}/ai/explain-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(simResult)
  });

  if (!res.ok) {
    return {
      is_available: false,
      model_name: 'qwen2.5:3b',
      summary_of_scenario: 'Could not contact AI service.',
      evidence_supporting_concern: [],
      critical_assumptions: [],
      alternative_explanations: [],
      practical_recommendations: [],
      disclaimer: 'Ollama is offline.',
      error_message: `HTTP error ${res.status} contacting backend AI service.`
    };
  }

  return res.json();
}

export async function explainHealthWithAI(healthData: Record<string, any>): Promise<AIHealthExplanation> {
  const res = await fetch(`${API_BASE}/ai/explain-health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(healthData)
  });

  if (!res.ok) {
    return {
      is_available: false,
      model_name: 'qwen2.5:3b',
      executive_summary: '',
      sustainability_strengths: [],
      vulnerabilities: [],
      actionable_next_steps: [],
      error_message: 'Could not reach AI explanation service.'
    };
  }

  return res.json();
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Failed to fetch system status');
  }
  return res.json();
}

export async function updateSystemSettings(settings: {
  github_token?: string;
  ollama_base_url?: string;
  ollama_model?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export async function clearBackendCache(): Promise<any> {
  const res = await fetch(`${API_BASE}/cache/clear`, {
    method: 'POST'
  });
  return res.json();
}
