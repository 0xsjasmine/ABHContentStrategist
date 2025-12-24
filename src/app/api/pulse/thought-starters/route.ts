import { NextRequest, NextResponse } from 'next/server';
import type { ThoughtStarter } from '@/types';

// Generate thought-provoking podcast-style questions based on an outlier tweet

interface ThoughtStarterResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  question?: string;
  angle?: string;
  storyPrompt?: string;
  error?: string;
}

function getThoughtStarterPrompt(
  tweetText: string,
  structureNotes: string,
  theLesson: string,
  sourceHandle: string,
  aiName: string
): string {
  return `You are ${aiName}, a thoughtful podcast host preparing questions for ABH (Ambitious But Human) - a voice for ambitious women navigating life, career, and relationships in the AI era.

## CONTEXT
A tweet by @${sourceHandle} performed exceptionally well. Your job is to create ONE thought-provoking question that helps ABH reflect on this topic and share her own authentic story.

### The Viral Tweet:
"${tweetText}"

### Why It Worked (Structure):
${structureNotes}

### The Lesson:
${theLesson}

## YOUR TASK
Create ONE podcast-style question that:
1. Connects to the THEME of the viral tweet (not the specific content)
2. Invites ABH to share a personal story or opinion
3. Has that "ooh, good question" energy - makes you pause and think
4. Could spark a vulnerable, authentic reflection

Think like you're interviewing her on a podcast. Questions that work:
- "What's a moment when you realized..."
- "Tell me about a time you had to choose between..."
- "What would you tell your younger self about..."
- "What's the thing about [topic] that nobody talks about?"
- "When did you first understand that..."

**OUTPUT FORMAT (JSON only):**
{
  "question": "The thought-provoking question",
  "angle": "What aspect/perspective this explores (2-4 words)",
  "storyPrompt": "A follow-up that digs into personal experience, like 'What happened next?' or 'How did that change you?'"
}

Be specific to the theme but make it personal to HER story, not about the original tweet.`;
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

// Call Grok
async function callGrok(prompt: string, apiKey: string): Promise<ThoughtStarterResult> {
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

    if (!parsed || !parsed.question) {
      return { ai: 'grok', success: false, error: 'Could not parse response' };
    }

    return {
      ai: 'grok',
      success: true,
      question: parsed.question,
      angle: parsed.angle,
      storyPrompt: parsed.storyPrompt,
    };
  } catch (error: any) {
    return { ai: 'grok', success: false, error: error.message };
  }
}

// Call Claude
async function callClaude(prompt: string, apiKey: string): Promise<ThoughtStarterResult> {
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
            max_tokens: 512,
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

        if (!parsed || !parsed.question) {
          return { ai: 'claude', success: false, error: 'Could not parse response' };
        }

        return {
          ai: 'claude',
          success: true,
          question: parsed.question,
          angle: parsed.angle,
          storyPrompt: parsed.storyPrompt,
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
async function callGPT(prompt: string, apiKey: string): Promise<ThoughtStarterResult> {
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

    if (!parsed || !parsed.question) {
      return { ai: 'gpt', success: false, error: 'Could not parse response' };
    }

    return {
      ai: 'gpt',
      success: true,
      question: parsed.question,
      angle: parsed.angle,
      storyPrompt: parsed.storyPrompt,
    };
  } catch (error: any) {
    return { ai: 'gpt', success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetText, structureNotes, theLesson, sourceHandle } = body;

    if (!tweetText || !structureNotes || !theLesson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get API keys
    const grokKey = process.env.XAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('\n========== THOUGHT STARTERS REQUEST ==========');
    console.log(`Source: @${sourceHandle}`);
    console.log(`Tweet: ${tweetText.slice(0, 100)}...`);

    // Generate prompts
    const grokPrompt = getThoughtStarterPrompt(tweetText, structureNotes, theLesson, sourceHandle, 'Grok');
    const claudePrompt = getThoughtStarterPrompt(tweetText, structureNotes, theLesson, sourceHandle, 'Claude');
    const gptPrompt = getThoughtStarterPrompt(tweetText, structureNotes, theLesson, sourceHandle, 'GPT');

    // Call all 3 AIs in parallel
    const [grokResult, claudeResult, gptResult] = await Promise.all([
      grokKey ? callGrok(grokPrompt, grokKey) : Promise.resolve({ ai: 'grok', success: false, error: 'API key not configured' } as ThoughtStarterResult),
      claudeKey ? callClaude(claudePrompt, claudeKey) : Promise.resolve({ ai: 'claude', success: false, error: 'API key not configured' } as ThoughtStarterResult),
      openaiKey ? callGPT(gptPrompt, openaiKey) : Promise.resolve({ ai: 'gpt', success: false, error: 'API key not configured' } as ThoughtStarterResult),
    ]);

    console.log('\n--- THOUGHT STARTER RESULTS ---');
    console.log(`Grok: ${grokResult.success ? '✓' : '✗'} ${grokResult.error || ''}`);
    console.log(`Claude: ${claudeResult.success ? '✓' : '✗'} ${claudeResult.error || ''}`);
    console.log(`GPT: ${gptResult.success ? '✓' : '✗'} ${gptResult.error || ''}`);

    // Convert to ThoughtStarter format
    const allResults = [grokResult, claudeResult, gptResult];
    const thoughtStarters: ThoughtStarter[] = [];

    for (const r of allResults) {
      if (r.success && r.question) {
        thoughtStarters.push({
          ai: r.ai,
          question: r.question,
          angle: r.angle || 'Reflection',
          storyPrompt: r.storyPrompt || 'Tell me more about that.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      thoughtStarters,
      successCount: thoughtStarters.length,
    });
  } catch (error: any) {
    console.error('[Thought Starters] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate thought starters' },
      { status: 500 }
    );
  }
}
