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

interface ReframeSuggestion {
  reframe: string;
  twist: string;
  emotionalArc: string;
}

interface BypassSuggestion {
  version: string;
  technique: string;
  patternBreak: string;
}

interface AIResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  hooks?: HookSuggestion[];
  reframes?: ReframeSuggestion[];
  bypasses?: BypassSuggestion[];
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

// Prediction Violation Prompt - reframes
function getPredictionViolationPrompt(userContent: string, aiName: string): string {
  return `You are ${aiName}, a master of the unexpected twist that DELIGHTS readers.

## THE PREDICTION VIOLATION PRINCIPLE
Subvert expectations in a way that gives readers something BETTER than what they expected.

Techniques that work:
- The twist ("I got fired. Best thing that ever happened.")
- The reframe ("They said I was too ambitious. I said thank you.")
- The unexpected conclusion (build up to something, deliver something better)
- The emotional pivot (sad to hopeful, frustrated to grateful)
- The reveal (what seemed bad was actually the key to success)

## USER'S CONTENT
"""
${userContent}
"""

## YOUR TASK
Generate 3 DIFFERENT reframes of this story that create positive prediction violations.

Each reframe should:
1. Take the original story but twist the ending or conclusion
2. Create an "oh!" moment of surprise
3. Feel inevitable in hindsight (not random)
4. Land on something emotionally satisfying

**OUTPUT FORMAT (JSON only):**
{
  "reframes": [
    {
      "reframe": "The reframed version of the story (full text, under 280 chars)",
      "twist": "What the twist is in 5-10 words",
      "emotionalArc": "sad-to-hopeful|frustration-to-gratitude|failure-to-insight|rejection-to-validation"
    }
  ]
}

Generate 3 reframes. Make readers say "wow, I didn't see that coming but it makes perfect sense."`;
}

// Habituation Bypass Prompt
function getHabituationBypassPrompt(userContent: string, aiName: string): string {
  return `You are ${aiName}, a master of breaking through scroll autopilot.

## THE HABITUATION BYPASS PRINCIPLE
The brain notices what's DIFFERENT. Pattern interrupts break through the scroll trance.

Techniques that work:
- Vulnerability/confession openers ("I cried in a bathroom stall today")
- Specific details that don't fit ("The $2.35 coffee that changed my career")
- Pattern breaks ("Everyone says X. They're wrong.")
- Unexpected structure (numbered lists mid-story, unusual formatting)
- Jarring first words (start with a verb, a number, or a sensory detail)
- Second-person direct address ("You're probably doing this wrong")

## USER'S CONTENT
"""
${userContent}
"""

## YOUR TASK
Generate 3 DIFFERENT versions that use habituation bypass techniques.

Each version should:
1. Completely reword to break familiar patterns
2. Use specific, unexpected details
3. Feel fresh and pattern-breaking
4. Keep the core message but deliver it unexpectedly

**OUTPUT FORMAT (JSON only):**
{
  "bypasses": [
    {
      "version": "The full reworded text (under 280 chars)",
      "technique": "confession|specific-detail|pattern-break|structure|jarring-opener|direct-address",
      "patternBreak": "What familiar pattern this breaks"
    }
  ]
}

Generate 3 versions. Make them impossible to scroll past because they're so DIFFERENT from everything else.`;
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
      reframes: parsed.reframes,
      bypasses: parsed.bypasses,
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
          reframes: parsed.reframes,
          bypasses: parsed.bypasses,
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
      reframes: parsed.reframes,
      bypasses: parsed.bypasses,
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
