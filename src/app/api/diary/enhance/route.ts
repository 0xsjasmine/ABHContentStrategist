import { NextRequest, NextResponse } from 'next/server';

// Enhanced content generation - 3 psychological dimensions

interface EnhanceRequest {
  userContent: string;
  dimension: 'curiosity-gap' | 'prediction-violation' | 'habituation-bypass';
}

interface HookSuggestion {
  hook: string;
  technique: string;
  whyItWorks: string;
}

interface AmplificationSuggestion {
  amplified: string;
  twist: string;
  emotionalArc: string;
}

interface FreshVersionSuggestion {
  fresh: string;
  technique: string;
  whatMakesItFresh: string;
}

interface AIResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  // Curiosity Gap
  hooks?: HookSuggestion[];
  // Prediction Violation & Habituation Bypass (shared fields)
  identifiedSection?: string;
  whereInContent?: string;
  whyThisIsTheBestPart?: string;
  // Prediction Violation specific
  amplifications?: AmplificationSuggestion[];
  // Habituation Bypass specific
  freshVersions?: FreshVersionSuggestion[];
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Extract JSON from AI response
function extractJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Curiosity Gap Prompt - 5 hooks
function getCuriosityGapPrompt(userContent: string, aiName: string): string {
  return `You are ${aiName}, a master of creating curiosity gaps that DEMAND clicks.

## THE CURIOSITY GAP PRINCIPLE
Create an information asymmetry that makes the reader's brain feel INCOMPLETE without knowing the answer.

Techniques that work:
- Open loops ("The one thing nobody tells you about...")
- Specific mystery ("She made $50K in 3 weeks doing this one thing")
- Counter-intuitive claims ("Why being lazy made me more productive")
- Implied secrets ("What I learned after 10 failed startups")
- Provocative questions ("What if everything you know about X is wrong?")

## USER'S CONTENT
"""
${userContent}
"""

## YOUR TASK
Generate 5 DIFFERENT hook variations for this content. Each hook should:
1. Create a curiosity gap that DEMANDS resolution
2. Be under 100 characters (punchy first line)
3. Use a different technique
4. Maintain the essence of the original story

**OUTPUT FORMAT (JSON only):**
{
  "hooks": [
    {
      "hook": "The exact hook text",
      "technique": "open-loop|specific-mystery|counter-intuitive|implied-secret|provocative-question",
      "whyItWorks": "Brief explanation of the curiosity mechanism"
    }
  ]
}

Generate 5 hooks. Be creative. Make them IMPOSSIBLE to scroll past.`;
}

// Prediction Violation Prompt - find the BEST part (anywhere) and amplify
function getPredictionViolationPrompt(userContent: string, aiName: string): string {
  return `You are ${aiName}, a master of the unexpected twist that DELIGHTS readers.

## THE PREDICTION VIOLATION PRINCIPLE
Subvert expectations in a way that gives readers something BETTER than what they expected.

## USER'S CONTENT
"""
${userContent}
"""

## YOUR TASK - CRITICAL
1. READ THE ENTIRE CONTENT and find the BEST PART - this is NOT the intro/hook
   - It's often the punchline, the realization, the vulnerable confession
   - It's the sentence that has the most EMOTIONAL WEIGHT or INSIGHT
   - It could be in the MIDDLE or at the END - look everywhere
   - DON'T just pick the first sentence

2. Apply positive prediction violation to THAT best part:
   - Add a twist that subverts expectation
   - Create an "oh!" moment
   - Make it land even harder

Examples of "best parts" to look for:
- The vulnerable admission ("I realized I was the problem")
- The insight/lesson ("Turns out rejection was protection")
- The emotional climax ("That's when I finally understood")
- The surprising conclusion ("So I quit. And started over.")

**OUTPUT FORMAT (JSON only):**
{
  "identifiedSection": "The EXACT sentence/phrase you found (NOT the intro - find the gold)",
  "whereInContent": "beginning|middle|end - where you found it",
  "whyThisIsTheBestPart": "Why this sentence has the most potential (be specific)",
  "amplifications": [
    {
      "amplified": "The amplified version with a twist (under 100 chars)",
      "twist": "The twist in 5-10 words",
      "emotionalArc": "sad-to-hopeful|frustration-to-gratitude|failure-to-insight|rejection-to-validation"
    }
  ]
}

Generate 3 amplifications. Find the GOLD first.`;
}

// Habituation Bypass Prompt - find the BEST part (anywhere) and make it unfamiliar
function getHabituationBypassPrompt(userContent: string, aiName: string): string {
  return `You are ${aiName}, a master of breaking through scroll autopilot.

## THE HABITUATION BYPASS PRINCIPLE
The brain notices what's DIFFERENT. Pattern interrupts break through the scroll trance.

Techniques:
- Vulnerability/confession framing ("I cried in a bathroom stall today")
- Hyper-specific details ("The $2.35 coffee that changed my career")
- Sensory language (what you saw, heard, felt physically)
- Jarring specificity (exact numbers, names, places)

## USER'S CONTENT
"""
${userContent}
"""

## YOUR TASK - CRITICAL
1. READ THE ENTIRE CONTENT and find the BEST PART - this is NOT the intro
   - It's the sentence with the most EMOTIONAL RESONANCE
   - It could be a realization, a confession, a punchline
   - It could be in the MIDDLE or at the END - look everywhere
   - DON'T just pick the first sentence

2. Make THAT best part hit harder using habituation bypass:
   - Add sensory details (what you saw, heard, felt)
   - Add jarring specificity (exact numbers, names, times)
   - Frame it as a vulnerable confession
   - Make it IMPOSSIBLE to scroll past

Examples of "best parts" to transform:
- A buried insight → make it visceral with sensory detail
- A generic statement → add jarring specificity
- An emotional moment → frame it as a confession

**OUTPUT FORMAT (JSON only):**
{
  "identifiedSection": "The EXACT sentence/phrase you found (NOT the intro - find the gold)",
  "whereInContent": "beginning|middle|end - where you found it",
  "whyThisIsTheBestPart": "Why this sentence could hit hardest (be specific)",
  "freshVersions": [
    {
      "fresh": "The fresh version with habituation bypass applied (under 100 chars)",
      "technique": "confession|specific-detail|sensory|jarring-specificity",
      "whatMakesItFresh": "What makes this version impossible to scroll past"
    }
  ]
}

Generate 3 fresh versions. Find the GOLD first.`;
}

// Call Grok
async function callGrok(prompt: string, apiKey: string, dimension: string): Promise<AIResult> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON<any>(content);

    // Extract usage data
    const usage = {
      inputTokens: data.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
      outputTokens: data.usage?.completion_tokens || Math.ceil(content.length / 4),
    };

    if (!parsed) {
      return { ai: 'grok', success: false, error: 'Could not parse response', usage };
    }

    return {
      ai: 'grok',
      success: true,
      hooks: parsed.hooks,
      identifiedSection: parsed.identifiedSection,
      whereInContent: parsed.whereInContent,
      whyThisIsTheBestPart: parsed.whyThisIsTheBestPart,
      amplifications: parsed.amplifications,
      freshVersions: parsed.freshVersions,
      usage,
    };
  } catch (error: any) {
    return { ai: 'grok', success: false, error: error.message };
  }
}

// Call Claude
async function callClaude(prompt: string, apiKey: string, dimension: string): Promise<AIResult> {
  try {
    const models = ['claude-sonnet-4-5-20250929', 'claude-3-5-sonnet-20241022'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          lastError = `Claude API error: ${response.status}`;
          continue;
        }

        const data = await response.json();
        const content = data.content?.[0]?.text || '';
        const parsed = extractJSON<any>(content);

        // Extract usage data
        const usage = {
          inputTokens: data.usage?.input_tokens || Math.ceil(prompt.length / 4),
          outputTokens: data.usage?.output_tokens || Math.ceil(content.length / 4),
        };

        if (!parsed) {
          return { ai: 'claude', success: false, error: 'Could not parse response', usage };
        }

        return {
          ai: 'claude',
          success: true,
          hooks: parsed.hooks,
          identifiedSection: parsed.identifiedSection,
          whereInContent: parsed.whereInContent,
          whyThisIsTheBestPart: parsed.whyThisIsTheBestPart,
          amplifications: parsed.amplifications,
          freshVersions: parsed.freshVersions,
          usage,
        };
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    return { ai: 'claude', success: false, error: lastError };
  } catch (error: any) {
    return { ai: 'claude', success: false, error: error.message };
  }
}

// Call GPT
async function callGPT(prompt: string, apiKey: string, dimension: string): Promise<AIResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON<any>(content);

    // Extract usage data
    const usage = {
      inputTokens: data.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
      outputTokens: data.usage?.completion_tokens || Math.ceil(content.length / 4),
    };

    if (!parsed) {
      return { ai: 'gpt', success: false, error: 'Could not parse response', usage };
    }

    return {
      ai: 'gpt',
      success: true,
      hooks: parsed.hooks,
      identifiedSection: parsed.identifiedSection,
      whereInContent: parsed.whereInContent,
      whyThisIsTheBestPart: parsed.whyThisIsTheBestPart,
      amplifications: parsed.amplifications,
      freshVersions: parsed.freshVersions,
      usage,
    };
  } catch (error: any) {
    return { ai: 'gpt', success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { userContent, dimension } = body;

    if (!userContent || userContent.length < 20) {
      return NextResponse.json({ error: 'Content must be at least 20 characters' }, { status: 400 });
    }

    if (!['curiosity-gap', 'prediction-violation', 'habituation-bypass'].includes(dimension)) {
      return NextResponse.json({ error: 'Invalid dimension' }, { status: 400 });
    }

    // Get API keys
    const grokKey = process.env.XAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log(`\n========== ENHANCE REQUEST: ${dimension.toUpperCase()} ==========`);
    console.log(`Content length: ${userContent.length} chars`);

    // Generate prompts based on dimension
    let grokPrompt: string, claudePrompt: string, gptPrompt: string;

    switch (dimension) {
      case 'curiosity-gap':
        grokPrompt = getCuriosityGapPrompt(userContent, 'Grok');
        claudePrompt = getCuriosityGapPrompt(userContent, 'Claude');
        gptPrompt = getCuriosityGapPrompt(userContent, 'GPT');
        break;
      case 'prediction-violation':
        grokPrompt = getPredictionViolationPrompt(userContent, 'Grok');
        claudePrompt = getPredictionViolationPrompt(userContent, 'Claude');
        gptPrompt = getPredictionViolationPrompt(userContent, 'GPT');
        break;
      case 'habituation-bypass':
        grokPrompt = getHabituationBypassPrompt(userContent, 'Grok');
        claudePrompt = getHabituationBypassPrompt(userContent, 'Claude');
        gptPrompt = getHabituationBypassPrompt(userContent, 'GPT');
        break;
      default:
        return NextResponse.json({ error: 'Invalid dimension' }, { status: 400 });
    }

    // Call all 3 AIs in parallel
    const [grokResult, claudeResult, gptResult] = await Promise.all([
      grokKey ? callGrok(grokPrompt, grokKey, dimension) : Promise.resolve({ ai: 'grok', success: false, error: 'API key not configured' } as AIResult),
      claudeKey ? callClaude(claudePrompt, claudeKey, dimension) : Promise.resolve({ ai: 'claude', success: false, error: 'API key not configured' } as AIResult),
      openaiKey ? callGPT(gptPrompt, openaiKey, dimension) : Promise.resolve({ ai: 'gpt', success: false, error: 'API key not configured' } as AIResult),
    ]);

    console.log('\n--- RESULTS ---');
    console.log(`Grok: ${grokResult.success ? '✓' : '✗'} ${grokResult.error || ''}`);
    console.log(`Claude: ${claudeResult.success ? '✓' : '✗'} ${claudeResult.error || ''}`);
    console.log(`GPT: ${gptResult.success ? '✓' : '✗'} ${gptResult.error || ''}`);

    // Aggregate usage data for client-side tracking
    const usage = {
      grok: grokResult.usage || { inputTokens: 0, outputTokens: 0 },
      claude: claudeResult.usage || { inputTokens: 0, outputTokens: 0 },
      openai: gptResult.usage || { inputTokens: 0, outputTokens: 0 },
    };

    return NextResponse.json({
      success: true,
      dimension,
      results: [grokResult, claudeResult, gptResult],
      successCount: [grokResult, claudeResult, gptResult].filter(r => r.success).length,
      usage,
    });
  } catch (error: any) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance content' },
      { status: 500 }
    );
  }
}
