import { NextRequest, NextResponse } from 'next/server';
import { getVoiceRemixPrompt, VoiceRemixRequest } from '@/prompts/abh-voice-remix';
import type { CreatorId, CreatorTweet, ImportedStructure } from '@/types';

// AI Response structure
interface AIRemixResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  tweet?: string;
  characterCount?: number;
  scores?: {
    curiosityGap: { score: number; reason: string };
    habituationBypass: { score: number; reason: string };
    predictionViolation: { score: number; reason: string };
  };
  structureBorrowed?: string;
  abhVoiceElement?: string;
  hookType?: string;
  alternativeAngle?: string;
  error?: string;
  rawResponse?: string;
}

// Extract JSON from AI response
function extractJSON<T>(text: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to find JSON in the text
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

// Call Grok (xAI)
async function callGrok(prompt: string, apiKey: string): Promise<AIRemixResult> {
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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON<any>(content);

    if (!parsed || !parsed.tweet) {
      return { ai: 'grok', success: false, error: 'Could not parse response', rawResponse: content };
    }

    return {
      ai: 'grok',
      success: true,
      tweet: parsed.tweet,
      characterCount: parsed.characterCount || parsed.tweet.length,
      scores: parsed.scores,
      structureBorrowed: parsed.structureBorrowed,
      abhVoiceElement: parsed.abhVoiceElement,
      hookType: parsed.hookType,
      alternativeAngle: parsed.alternativeAngle,
    };
  } catch (error: any) {
    return { ai: 'grok', success: false, error: error.message };
  }
}

// Call Claude
async function callClaude(prompt: string, apiKey: string): Promise<AIRemixResult> {
  try {
    const models = [
      'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022',
    ];

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
            max_tokens: 1024,
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

        if (!parsed || !parsed.tweet) {
          return { ai: 'claude', success: false, error: 'Could not parse response', rawResponse: content };
        }

        return {
          ai: 'claude',
          success: true,
          tweet: parsed.tweet,
          characterCount: parsed.characterCount || parsed.tweet.length,
          scores: parsed.scores,
          structureBorrowed: parsed.structureBorrowed,
          abhVoiceElement: parsed.abhVoiceElement,
          hookType: parsed.hookType,
          alternativeAngle: parsed.alternativeAngle,
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

// Call GPT-4o
async function callGPT(prompt: string, apiKey: string): Promise<AIRemixResult> {
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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON<any>(content);

    if (!parsed || !parsed.tweet) {
      return { ai: 'gpt', success: false, error: 'Could not parse response', rawResponse: content };
    }

    return {
      ai: 'gpt',
      success: true,
      tweet: parsed.tweet,
      characterCount: parsed.characterCount || parsed.tweet.length,
      scores: parsed.scores,
      structureBorrowed: parsed.structureBorrowed,
      abhVoiceElement: parsed.abhVoiceElement,
      hookType: parsed.hookType,
      alternativeAngle: parsed.alternativeAngle,
    };
  } catch (error: any) {
    return { ai: 'gpt', success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, selectedTweetId, userContent, contentType, importedStructure } = body;

    // Validate inputs
    if (!creatorId || !['steven', 'mylene', 'greg'].includes(creatorId)) {
      return NextResponse.json({ error: 'Invalid creator ID' }, { status: 400 });
    }

    if (!userContent || userContent.length < 20) {
      return NextResponse.json({ error: 'Content must be at least 20 characters' }, { status: 400 });
    }

    // Get API keys
    const grokKey = process.env.XAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('\n========== VOICE REMIX REQUEST ==========');
    console.log(`Creator: ${creatorId}`);
    console.log(`Content length: ${userContent.length} chars`);
    console.log('API Keys:');
    console.log(`  XAI: ${grokKey ? '✓' : '✗'}`);
    console.log(`  ANTHROPIC: ${claudeKey ? '✓' : '✗'}`);
    console.log(`  OPENAI: ${openaiKey ? '✓' : '✗'}`);

    // Load creator tweets from request (they come from localStorage on client)
    const creatorTweets: CreatorTweet[] = body.creatorTweets || [];

    if (creatorTweets.length === 0) {
      return NextResponse.json(
        { error: `No tweets found in ${creatorId}'s library. Add some tweets first!` },
        { status: 400 }
      );
    }

    // If a specific tweet is selected, prioritize it
    let tweetsToUse = creatorTweets;
    if (selectedTweetId) {
      const selected = creatorTweets.find(t => t.id === selectedTweetId);
      if (selected) {
        tweetsToUse = [selected, ...creatorTweets.filter(t => t.id !== selectedTweetId).slice(0, 2)];
      }
    } else {
      // Use up to 3 most recent tweets
      tweetsToUse = creatorTweets.slice(0, 3);
    }

    // Build the request object
    const remixRequest: VoiceRemixRequest = {
      creatorId: creatorId as CreatorId,
      creatorTweets: tweetsToUse.map(t => ({
        text: t.text,
        author: t.author,
        handle: t.handle,
      })),
      userContent,
      contentType: contentType || 'stories',
      // Include imported structure if provided
      importedStructure: importedStructure as ImportedStructure | undefined,
    };

    // Log if using imported structure
    if (importedStructure) {
      console.log(`  Using imported structure from @${importedStructure.sourceHandle}`)
      console.log(`  Structure: ${importedStructure.structureNotes}`);
    }

    // Generate prompts for each AI
    const grokPrompt = getVoiceRemixPrompt(remixRequest, 'Grok');
    const claudePrompt = getVoiceRemixPrompt(remixRequest, 'Claude');
    const gptPrompt = getVoiceRemixPrompt(remixRequest, 'GPT');

    // Call all 3 AIs in parallel
    const [grokResult, claudeResult, gptResult] = await Promise.all([
      grokKey ? callGrok(grokPrompt, grokKey) : Promise.resolve({ ai: 'grok' as const, success: false, error: 'API key not configured' }),
      claudeKey ? callClaude(claudePrompt, claudeKey) : Promise.resolve({ ai: 'claude' as const, success: false, error: 'API key not configured' }),
      openaiKey ? callGPT(gptPrompt, openaiKey) : Promise.resolve({ ai: 'gpt' as const, success: false, error: 'API key not configured' }),
    ]);

    console.log('\n--- RESULTS ---');
    console.log(`Grok: ${grokResult.success ? '✓' : '✗'} ${grokResult.error || ''}`);
    console.log(`Claude: ${claudeResult.success ? '✓' : '✗'} ${claudeResult.error || ''}`);
    console.log(`GPT: ${gptResult.success ? '✓' : '✗'} ${gptResult.error || ''}`);

    // Calculate average scores for ranking
    const calculateAvgScore = (result: AIRemixResult): number => {
      if (!result.success || !result.scores) return 0;
      return (
        (result.scores.curiosityGap?.score || 0) +
        (result.scores.habituationBypass?.score || 0) +
        (result.scores.predictionViolation?.score || 0)
      ) / 3;
    };

    // Sort by average score
    const results = [grokResult, claudeResult, gptResult]
      .filter(r => r.success)
      .sort((a, b) => calculateAvgScore(b) - calculateAvgScore(a));

    return NextResponse.json({
      success: true,
      creatorId,
      results: [grokResult, claudeResult, gptResult],
      bestResult: results[0] || null,
      successCount: results.length,
    });
  } catch (error: any) {
    console.error('[Voice Remix] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate remix' },
      { status: 500 }
    );
  }
}
