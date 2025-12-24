// API Usage Tracking Utility
// Shared across all client components

// Cost per token (approximate, based on 2024 pricing)
const CLAUDE_INPUT_COST = 0.003 / 1000;  // $3 per 1M input tokens
const CLAUDE_OUTPUT_COST = 0.015 / 1000; // $15 per 1M output tokens
const GROK_INPUT_COST = 0.005 / 1000;    // $5 per 1M input tokens (estimated)
const GROK_OUTPUT_COST = 0.015 / 1000;   // $15 per 1M output tokens (estimated)
const OPENAI_INPUT_COST = 0.0025 / 1000;  // $2.50 per 1M input tokens (GPT-4o)
const OPENAI_OUTPUT_COST = 0.01 / 1000;   // $10 per 1M output tokens (GPT-4o)

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface FeatureUsage {
  feature: string;
  calls: number;
  cost: number;
}

export interface MonthlyUsage {
  month: string;
  claude: { calls: number; cost: number; tokens: number };
  grok: { calls: number; cost: number; tokens: number };
  openai: { calls: number; cost: number; tokens: number };
  features: FeatureUsage[];
}

export interface ApiUsageData {
  claude?: TokenUsage;
  grok?: TokenUsage;
  openai?: TokenUsage;
}

/**
 * Updates API usage in localStorage for a specific feature
 * @param usage - Token usage from each AI provider
 * @param featureName - Name of the feature (e.g., 'Roundtable', 'Diary Enhance', 'Pulse Outliers')
 */
export function updateApiUsage(
  usage: ApiUsageData,
  featureName: string
): void {
  if (typeof window === 'undefined') return; // Only runs on client

  const claudeUsage = usage.claude || { inputTokens: 0, outputTokens: 0 };
  const grokUsage = usage.grok || { inputTokens: 0, outputTokens: 0 };
  const openaiUsage = usage.openai || { inputTokens: 0, outputTokens: 0 };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const storageKey = `abh_api_usage_${currentMonth}`;

  // Calculate costs
  const claudeTokens = claudeUsage.inputTokens + claudeUsage.outputTokens;
  const grokTokens = grokUsage.inputTokens + grokUsage.outputTokens;
  const openaiTokens = openaiUsage.inputTokens + openaiUsage.outputTokens;
  const claudeCost = (claudeUsage.inputTokens * CLAUDE_INPUT_COST) + (claudeUsage.outputTokens * CLAUDE_OUTPUT_COST);
  const grokCost = (grokUsage.inputTokens * GROK_INPUT_COST) + (grokUsage.outputTokens * GROK_OUTPUT_COST);
  const openaiCost = (openaiUsage.inputTokens * OPENAI_INPUT_COST) + (openaiUsage.outputTokens * OPENAI_OUTPUT_COST);

  // Get existing or create new
  let monthlyUsage: MonthlyUsage = {
    month: currentMonth,
    claude: { calls: 0, cost: 0, tokens: 0 },
    grok: { calls: 0, cost: 0, tokens: 0 },
    openai: { calls: 0, cost: 0, tokens: 0 },
    features: [],
  };

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      monthlyUsage = JSON.parse(stored);
      // Ensure features array and openai exists
      if (!monthlyUsage.features) monthlyUsage.features = [];
      if (!monthlyUsage.openai) monthlyUsage.openai = { calls: 0, cost: 0, tokens: 0 };
    }
  } catch {
    // Use default
  }

  // Update Claude
  if (claudeUsage.inputTokens > 0) {
    monthlyUsage.claude.calls += 1;
    monthlyUsage.claude.tokens += claudeTokens;
    monthlyUsage.claude.cost += claudeCost;
  }

  // Update Grok
  if (grokUsage.inputTokens > 0) {
    monthlyUsage.grok.calls += 1;
    monthlyUsage.grok.tokens += grokTokens;
    monthlyUsage.grok.cost += grokCost;
  }

  // Update OpenAI
  if (openaiUsage.inputTokens > 0) {
    monthlyUsage.openai.calls += 1;
    monthlyUsage.openai.tokens += openaiTokens;
    monthlyUsage.openai.cost += openaiCost;
  }

  // Update features breakdown
  const totalCost = claudeCost + grokCost + openaiCost;
  if (totalCost > 0) {
    const existingFeature = monthlyUsage.features.find(f => f.feature === featureName);
    if (existingFeature) {
      existingFeature.calls += 1;
      existingFeature.cost += totalCost;
    } else {
      monthlyUsage.features.push({ feature: featureName, calls: 1, cost: totalCost });
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(monthlyUsage));
}

/**
 * Calculate estimated tokens from text length (fallback when API doesn't return usage)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
