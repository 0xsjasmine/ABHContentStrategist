import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Extract tweet text from oEmbed HTML
function extractTweetText(html: string): string {
  // The tweet text is inside <p> tags within the blockquote
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (pMatch) {
    // Clean up HTML entities and tags
    return pMatch[1]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  return '';
}

// Fetch tweet data from Twitter oEmbed API
async function fetchTweetFromOEmbed(tweetUrl: string): Promise<{
  text: string;
  author: string;
  html: string;
}> {
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;

  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch tweet: ${response.status}`);
  }

  const data = await response.json();
  const text = extractTweetText(data.html);

  return {
    text,
    author: data.author_name || 'Unknown',
    html: data.html,
  };
}

// Extract handle from tweet URL
function extractHandle(url: string): string {
  const match = url.match(/twitter\.com\/([^\/]+)|x\.com\/([^\/]+)/);
  return match ? (match[1] || match[2]) : '';
}

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

4. ADDITIONAL TRIGGERS (analyze each one that's present)
- Social Proof: Does it leverage others' behavior/opinions?
- Loss Aversion: Does it frame around avoiding loss?
- Identity Signaling: Does it help readers signal who they are?
- Specificity: Are there concrete numbers, names, details?
- Vulnerability: Does it show weakness or humanness?
- Permission Giving: Does it give readers permission to feel/do something?
- Pattern Completion: Does it set up a pattern the brain wants to finish?

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
    "socialProof": { "present": <true/false>, "analysis": "<1-2 sentences if present, empty if not>" },
    "lossAversion": { "present": <true/false>, "analysis": "<1-2 sentences if present, empty if not>" },
    "identitySignaling": { "present": <true/false>, "analysis": "<1-2 sentences if present, empty if not>" },
    "specificity": { "level": "<low/medium/high>", "analysis": "<1-2 sentences explaining the specificity>" },
    "vulnerability": { "level": "<low/medium/high>", "analysis": "<1-2 sentences explaining the vulnerability>" },
    "permissionGiving": { "present": <true/false>, "analysis": "<1-2 sentences if present, empty if not>" },
    "patternCompletion": { "present": <true/false>, "analysis": "<1-2 sentences if present, empty if not>" }
  },
  "keyInsight": "<One key insight about why this tweet works, unique to your perspective>",
  "alignmentScores": {
    "abhFit": <1-10>,
    "voiceMatch": <1-10>,
    "communityResonance": <1-10>
  }
}`;

async function analyzeWithClaude(tweet: string, author: string): Promise<{ analysis: unknown; usage: { inputTokens: number; outputTokens: number } }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Debug: Check if API key is loaded (only show first/last few chars for security)
  if (apiKey) {
    console.log(`[Claude] API key loaded: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)} (length: ${apiKey.length})`);
  } else {
    console.log('[Claude] WARNING: No API key found!');
  }

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });

  // Use Claude Sonnet 4.5 - the best coding model
  // https://www.anthropic.com/news/claude-sonnet-4-5
  const models = ['claude-sonnet-4-5-20250929'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Trying Claude model: ${model}`);
      const response = await client.messages.create({
        model,
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

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse Claude response');
      }

      console.log(`Claude model ${model} succeeded`);
      return {
        analysis: JSON.parse(jsonMatch[0]),
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Claude model ${model} failed:`, errorMessage);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model
    }
  }

  console.error('All Claude models failed. Last error:', lastError?.message);
  throw lastError || new Error('All Claude models failed');
}

async function analyzeWithGrok(tweet: string, author: string): Promise<{ analysis: unknown; usage: { inputTokens: number; outputTokens: number } }> {
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

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Grok response');
  }

  return {
    analysis: JSON.parse(jsonMatch[0]),
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}

async function analyzeWithOpenAI(tweet: string, author: string): Promise<{ analysis: unknown; usage: { inputTokens: number; outputTokens: number } }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are GPT-4, a powerful language model specializing in content analysis and psychological frameworks. You provide structured, actionable insights.',
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
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse OpenAI response');
  }

  return {
    analysis: JSON.parse(jsonMatch[0]),
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}

function generateAgreements(
  claudeAnalysis: Record<string, unknown>,
  grokAnalysis: Record<string, unknown>
): string[] {
  const agreements: string[] = [];

  const claudeCG = claudeAnalysis.curiosityGap as { score: number; analysis: string };
  const grokCG = grokAnalysis.curiosityGap as { score: number; analysis: string };
  if (Math.abs(claudeCG.score - grokCG.score) <= 2 && claudeCG.score >= 6) {
    agreements.push(
      `Strong curiosity gap (avg ${((claudeCG.score + grokCG.score) / 2).toFixed(1)}/10)`
    );
  }

  const claudeHB = claudeAnalysis.habituationBypass as { score: number };
  const grokHB = grokAnalysis.habituationBypass as { score: number };
  if (claudeHB.score >= 7 && grokHB.score >= 7) {
    agreements.push('Effective habituation bypass through unique framing');
  }

  const claudeTriggers = claudeAnalysis.additionalTriggers as Record<string, unknown>;
  const grokTriggers = grokAnalysis.additionalTriggers as Record<string, unknown>;
  if (claudeTriggers.permissionGiving && grokTriggers.permissionGiving) {
    agreements.push('Permission-giving language that resonates');
  }
  if (claudeTriggers.identitySignaling && grokTriggers.identitySignaling) {
    agreements.push('Strong identity signaling for target audience');
  }

  const claudePV = claudeAnalysis.predictionViolation as { score: number };
  const grokPV = grokAnalysis.predictionViolation as { score: number };
  if (claudePV.score >= 7 && grokPV.score >= 7) {
    agreements.push('Powerful prediction violation that surprises and delights');
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

  const claudeCG = claudeAnalysis.curiosityGap as { score: number };
  if (claudeCG.score >= 7) {
    const firstWords = tweet.split(' ').slice(0, 4).join(' ');
    takeaways.push({
      category: 'structure',
      title: 'Use curiosity gap openers',
      description: 'Open with information that creates a knowledge gap the reader wants to fill',
      example: `Try: "${firstWords}..." structure`,
    });
  }

  const grokHB = grokAnalysis.habituationBypass as { score: number; details?: string[] };
  if (grokHB.score >= 7) {
    takeaways.push({
      category: 'language',
      title: 'Borrow from unexpected domains',
      description: 'Use language from gaming, science, or other fields to make familiar advice fresh',
      example: grokHB.details?.[0] || 'Cross-domain metaphors increase memorability',
    });
  }

  const claudePV = claudeAnalysis.predictionViolation as { score: number; details?: string[] };
  if (claudePV.score >= 7) {
    takeaways.push({
      category: 'positioning',
      title: 'Violate expectations strategically',
      description: 'Set up one expectation, then deliver something surprisingly better',
      example: claudePV.details?.[1] || 'Counter conventional wisdom with lived experience',
    });
  }

  const claudeTriggers = claudeAnalysis.additionalTriggers as Record<string, unknown>;
  if (claudeTriggers.permissionGiving) {
    takeaways.push({
      category: 'timing',
      title: 'Give permission',
      description: 'Allow your audience to feel okay about something they secretly want',
      example: 'Start with "It\'s okay to..." or "You don\'t have to..."',
    });
  }

  if (takeaways.length === 0) {
    takeaways.push({
      category: 'format',
      title: 'Study this structure',
      description: 'The format itself contributes to engagement',
      example: 'Notice how the tweet flows from hook to value',
    });
  }

  return takeaways.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { tweet, author, handle, url } = body;
    const { engagement } = body;
    let embedHtml = '';

    // If URL provided, fetch from oEmbed
    if (url && !tweet) {
      try {
        const oembedData = await fetchTweetFromOEmbed(url);
        tweet = oembedData.text;
        author = oembedData.author;
        handle = handle || extractHandle(url);
        embedHtml = oembedData.html;
      } catch (error) {
        console.error('oEmbed fetch error:', error);
        return NextResponse.json(
          { error: 'Could not fetch tweet. Please paste the tweet text manually.' },
          { status: 400 }
        );
      }
    }

    if (!tweet || !author) {
      return NextResponse.json({ error: 'Tweet text and author are required' }, { status: 400 });
    }

    // Run all three analyses in parallel
    const [claudeResult, grokResult, openaiResult] = await Promise.allSettled([
      analyzeWithClaude(tweet, handle || author),
      analyzeWithGrok(tweet, handle || author),
      analyzeWithOpenAI(tweet, handle || author),
    ]);

    const defaultAnalysis = {
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
      keyInsight: 'Analysis unavailable',
      alignmentScores: { abhFit: 0, voiceMatch: 0, communityResonance: 0 },
    };

    const claudeAnalysis =
      claudeResult.status === 'fulfilled' ? claudeResult.value.analysis : defaultAnalysis;

    const grokAnalysis =
      grokResult.status === 'fulfilled' ? grokResult.value.analysis : defaultAnalysis;

    const openaiAnalysis =
      openaiResult.status === 'fulfilled' ? openaiResult.value.analysis : defaultAnalysis;

    // Track usage for cost calculation
    const claudeUsage = claudeResult.status === 'fulfilled' ? claudeResult.value.usage : { inputTokens: 0, outputTokens: 0 };
    const grokUsage = grokResult.status === 'fulfilled' ? grokResult.value.usage : { inputTokens: 0, outputTokens: 0 };
    const openaiUsage = openaiResult.status === 'fulfilled' ? openaiResult.value.usage : { inputTokens: 0, outputTokens: 0 };

    const analysis = {
      id: crypto.randomUUID(),
      tweet: {
        author,
        handle: handle || author,
        text: tweet,
        url,
        embedHtml,
        engagement: engagement || { likes: 0, replies: 0, retweets: 0 },
        postedAt: new Date().toISOString(),
      },
      grokAnalysis: {
        model: 'grok',
        ...(grokAnalysis as object),
      },
      claudeAnalysis: {
        model: 'claude',
        ...(claudeAnalysis as object),
      },
      openaiAnalysis: {
        model: 'openai',
        ...(openaiAnalysis as object),
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
      usage: {
        claude: claudeUsage,
        grok: grokUsage,
        openai: openaiUsage,
      },
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
