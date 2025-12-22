import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const PSYCHOLOGY_PROMPT = `You are an expert content psychologist analyzing viral tweets. Analyze the following tweet using these psychological frameworks:

1. CURIOSITY GAP (George Loewenstein's Information Gap Theory)
- Where does the gap open?
- How wide is the gap?
- When/how does it close?
- Are there multiple gaps?

2. POSITIVE PREDICTION VIOLATION (Rory Sutherland)
- What was the expected pattern?
- How was it violated?
- What emotional response does this trigger?
- Why does it feel refreshing?

3. HABITUATION BYPASS (Steven Bartlett)
- What pattern does it interrupt?
- What makes it different from typical content?
- Are there sensory/structural surprises?
- What format innovations exist?

4. ADDITIONAL TRIGGERS
- Social Proof (present/absent)
- Loss Aversion (present/absent)
- Identity Signaling (present/absent)
- Specificity Level (low/medium/high)
- Vulnerability Factor (low/medium/high)
- Permission Giving (present/absent)
- Pattern Completion (present/absent)

5. ALIGNMENT SCORES (for "Ambitious But Human" brand)
- ABH Fit (1-10): Does it balance ambition + humanity?
- Voice Match (1-10): Could this be authentic to a driven but relatable voice?
- Community Resonance (1-10): Would ambitious twentysomethings care?

Respond in this exact JSON format:
{
  "curiosityGap": {
    "score": <1-10>,
    "analysis": "<2-3 sentences explaining the curiosity gap>",
    "details": ["<detail 1>", "<detail 2>"]
  },
  "predictionViolation": {
    "score": <1-10>,
    "analysis": "<2-3 sentences explaining the prediction violation>",
    "details": ["Expected: <what was expected>", "Got: <what they got>", "Emotional shift: <the shift>"]
  },
  "habituationBypass": {
    "score": <1-10>,
    "analysis": "<2-3 sentences explaining the habituation bypass>",
    "details": ["<technique 1>", "<technique 2>"]
  },
  "additionalTriggers": {
    "socialProof": <true/false>,
    "lossAversion": <true/false>,
    "identitySignaling": <true/false>,
    "specificityLevel": "<low/medium/high>",
    "vulnerabilityFactor": "<low/medium/high>",
    "permissionGiving": <true/false>,
    "patternCompletion": <true/false>
  },
  "keyInsight": "<One key insight about why this tweet works, unique to your perspective>",
  "alignmentScores": {
    "abhFit": <1-10>,
    "voiceMatch": <1-10>,
    "communityResonance": <1-10>
  }
}`;

async function analyzeWithClaude(tweet: string, author: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${PSYCHOLOGY_PROMPT}\n\nTWEET by @${author}:\n"${tweet}"`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function analyzeWithGrok(tweet: string, author: string): Promise<unknown> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'system',
          content:
            'You are Grok, an AI with real-time access to X/Twitter data and cultural context. You analyze content with wit and insight.',
        },
        {
          role: 'user',
          content: `${PSYCHOLOGY_PROMPT}\n\nTWEET by @${author}:\n"${tweet}"`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in Grok response');
  }

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Grok response');
  }

  return JSON.parse(jsonMatch[0]);
}

function generateAgreements(
  claudeAnalysis: Record<string, unknown>,
  grokAnalysis: Record<string, unknown>
): string[] {
  const agreements: string[] = [];

  // Compare curiosity gap scores
  const claudeCG = claudeAnalysis.curiosityGap as { score: number; analysis: string };
  const grokCG = grokAnalysis.curiosityGap as { score: number; analysis: string };
  if (Math.abs(claudeCG.score - grokCG.score) <= 2) {
    agreements.push(
      `Strong curiosity gap (avg ${((claudeCG.score + grokCG.score) / 2).toFixed(1)}/10)`
    );
  }

  // Compare habituation bypass
  const claudeHB = claudeAnalysis.habituationBypass as { score: number };
  const grokHB = grokAnalysis.habituationBypass as { score: number };
  if (claudeHB.score >= 7 && grokHB.score >= 7) {
    agreements.push('Effective habituation bypass through unique framing');
  }

  // Check for common triggers
  const claudeTriggers = claudeAnalysis.additionalTriggers as Record<string, unknown>;
  const grokTriggers = grokAnalysis.additionalTriggers as Record<string, unknown>;
  if (claudeTriggers.permissionGiving && grokTriggers.permissionGiving) {
    agreements.push('Permission-giving language that resonates');
  }
  if (claudeTriggers.identitySignaling && grokTriggers.identitySignaling) {
    agreements.push('Strong identity signaling for target audience');
  }

  return agreements.length > 0
    ? agreements
    : ['Both models found effective psychological hooks', 'Content structure supports engagement'];
}

function generateDifferences(
  claudeAnalysis: Record<string, unknown>,
  grokAnalysis: Record<string, unknown>
): { grokFocus: string; claudeFocus: string } {
  return {
    grokFocus: (grokAnalysis.keyInsight as string) || 'Real-time cultural relevance and timing',
    claudeFocus:
      (claudeAnalysis.keyInsight as string) || 'Deep psychological structure and emotional arc',
  };
}

function generateTakeaways(
  tweet: string,
  claudeAnalysis: Record<string, unknown>,
  grokAnalysis: Record<string, unknown>
): Array<{
  category: string;
  title: string;
  description: string;
  example: string;
}> {
  const takeaways = [];

  // Structure takeaway based on curiosity gap
  const claudeCG = claudeAnalysis.curiosityGap as { score: number };
  if (claudeCG.score >= 7) {
    takeaways.push({
      category: 'structure',
      title: 'Use curiosity gap openers',
      description: 'Open with information that creates a knowledge gap the reader wants to fill',
      example: `Try: "The ${tweet.split(' ').slice(0, 3).join(' ')}..." structure`,
    });
  }

  // Language takeaway based on habituation bypass
  const grokHB = grokAnalysis.habituationBypass as { score: number; details?: string[] };
  if (grokHB.score >= 7) {
    takeaways.push({
      category: 'language',
      title: 'Borrow from unexpected domains',
      description: 'Use language from gaming, science, or other fields to make familiar advice fresh',
      example: grokHB.details?.[0] || 'Cross-domain metaphors increase memorability',
    });
  }

  // Positioning takeaway based on prediction violation
  const claudePV = claudeAnalysis.predictionViolation as { score: number };
  if (claudePV.score >= 7) {
    takeaways.push({
      category: 'positioning',
      title: 'Violate expectations strategically',
      description: 'Set up one expectation, then deliver something surprisingly better',
      example: 'Counter conventional wisdom with lived experience',
    });
  }

  // Default takeaway if none generated
  if (takeaways.length === 0) {
    takeaways.push({
      category: 'format',
      title: 'Study this structure',
      description: 'The format itself contributes to engagement',
      example: 'Notice how the tweet flows from hook to value',
    });
  }

  return takeaways;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweet, author, handle, engagement, url, postedAt } = body;

    if (!tweet || !author) {
      return NextResponse.json({ error: 'Tweet and author are required' }, { status: 400 });
    }

    // Run both analyses in parallel
    const [claudeResult, grokResult] = await Promise.allSettled([
      analyzeWithClaude(tweet, handle || author),
      analyzeWithGrok(tweet, handle || author),
    ]);

    // Handle potential failures gracefully
    const claudeAnalysis =
      claudeResult.status === 'fulfilled'
        ? claudeResult.value
        : {
            curiosityGap: { score: 0, analysis: 'Analysis unavailable', details: [] },
            predictionViolation: { score: 0, analysis: 'Analysis unavailable', details: [] },
            habituationBypass: { score: 0, analysis: 'Analysis unavailable', details: [] },
            additionalTriggers: {
              socialProof: false,
              lossAversion: false,
              identitySignaling: false,
              specificityLevel: 'low',
              vulnerabilityFactor: 'low',
              permissionGiving: false,
              patternCompletion: false,
            },
            keyInsight: 'Claude analysis unavailable',
            alignmentScores: { abhFit: 0, voiceMatch: 0, communityResonance: 0 },
          };

    const grokAnalysis =
      grokResult.status === 'fulfilled'
        ? grokResult.value
        : {
            curiosityGap: { score: 0, analysis: 'Analysis unavailable', details: [] },
            predictionViolation: { score: 0, analysis: 'Analysis unavailable', details: [] },
            habituationBypass: { score: 0, analysis: 'Analysis unavailable', details: [] },
            additionalTriggers: {
              socialProof: false,
              lossAversion: false,
              identitySignaling: false,
              specificityLevel: 'low',
              vulnerabilityFactor: 'low',
              permissionGiving: false,
              patternCompletion: false,
            },
            keyInsight: 'Grok analysis unavailable',
            alignmentScores: { abhFit: 0, voiceMatch: 0, communityResonance: 0 },
          };

    const analysis = {
      id: crypto.randomUUID(),
      tweet: {
        author,
        handle: handle || author,
        text: tweet,
        url,
        engagement: engagement || { likes: 0, replies: 0, retweets: 0 },
        postedAt: postedAt || new Date().toISOString(),
      },
      grokAnalysis: {
        model: 'grok',
        ...(grokAnalysis as object),
      },
      claudeAnalysis: {
        model: 'claude',
        ...(claudeAnalysis as object),
      },
      agreements: {
        points: generateAgreements(
          claudeAnalysis as Record<string, unknown>,
          grokAnalysis as Record<string, unknown>
        ),
      },
      differences: generateDifferences(
        claudeAnalysis as Record<string, unknown>,
        grokAnalysis as Record<string, unknown>
      ),
      takeaways: generateTakeaways(
        tweet,
        claudeAnalysis as Record<string, unknown>,
        grokAnalysis as Record<string, unknown>
      ),
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Roundtable analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
