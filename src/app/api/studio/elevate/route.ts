import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface PulseInsight {
  id: string;
  headline: string;
  subtitle?: string;
  key_insight?: string;
  summary?: string;
  category?: string;
}

interface RoundtableInsight {
  id: string;
  tweet: {
    author: string;
    text: string;
  };
  grokAnalysis: {
    keyInsight: string;
    curiosityGap: { score: number; explanation: string };
    predictionViolation: { score: number; explanation: string };
    habituationBypass: { score: number; explanation: string };
  };
  claudeAnalysis: {
    keyInsight: string;
    curiosityGap: { score: number; explanation: string };
    predictionViolation: { score: number; explanation: string };
    habituationBypass: { score: number; explanation: string };
  };
  takeaways?: Array<{ takeaway: string; category: string }>;
}

interface ElevateRequest {
  draft: string;
  pulseInsights?: PulseInsight[];
  roundtableInsights?: RoundtableInsight[];
}

const ELEVATE_PROMPT = `You are the voice of Ambitious But Human (ABH), a community for ambitious women in entertainment, tech, and culture - where being human is the competitive advantage in the AI era.

**YOUR TASK:**
Take the user's draft tweet and ELEVATE it using:

1. **PSYCHOLOGICAL PRINCIPLES:**
   - **Positive Prediction Violation**: Subvert expectations with surprising turns, unexpected insights, or counterintuitive conclusions
   - **Curiosity Gap**: Create an information gap that compels the reader to engage - tease without giving everything away
   - **Bypass Habituation Filters**: Use pattern interrupts, unconventional framing, or fresh language that breaks through the noise

2. **INSIGHTS INTEGRATION:**
   You'll be given insights from two sources:
   - **Pulse Insights**: Current topics and themes from the ABH watchlist
   - **Roundtable Insights**: Analysis of high-performing tweets with psychology breakdowns

   Use these to:
   - Add relevant, timely references that make the tweet feel connected to the conversation
   - Apply proven structures and techniques from analyzed tweets
   - Incorporate key insights that amplify the message

**ABH BRAND VOICE:**
- Conversational, not corporate - sounds like a voice note to your best friend
- Insightful, not preachy - observations, not instructions
- Optimistic, not toxic positive - honest about hard things while maintaining hope
- Warm, not performative - genuine care
- Smart, not academic - accessible intelligence
- Funny, not trying too hard - wit that lands naturally

**CONTENT PILLARS:**
1. FRIENDSHIPS - The power of real connection, female friendships, finding your people
2. AI - Staying human in the AI era, leveraging technology, the future of work
3. AMBITION - Building, creating, career growth, chasing dreams unapologetically
4. TWENTIES - Figuring it out together, quarter-life transitions, unprecedented times

**RULES:**
- Keep it under 280 characters unless it's clearly a thread
- Write in first person as if you ARE the ABH founder
- No corporate speak, no jargon
- Be vulnerable when appropriate
- Think "smart friend texting" not "brand posting"
- Avoid overused phrases like "hot take" or "let's talk about"
- No emojis unless the draft already has them
- If the draft is good, just polish - don't overhaul

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "elevatedTweet": "The polished tweet text",
  "psychologyApplied": {
    "predictionViolation": "Brief explanation of how you applied this (or null if not applicable)",
    "curiosityGap": "Brief explanation (or null)",
    "habituationBypass": "Brief explanation (or null)"
  },
  "insightsUsed": ["Which insight headlines/takeaways influenced the output"],
  "changes": "One sentence explaining what you elevated"
}
\`\`\``;

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 503 }
      );
    }

    const body: ElevateRequest = await request.json();
    const { draft, pulseInsights = [], roundtableInsights = [] } = body;

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft is required' },
        { status: 400 }
      );
    }

    // Format insights for the prompt
    const pulseContext = pulseInsights.length > 0
      ? `\n**PULSE INSIGHTS (Current trends from watchlist):**\n${pulseInsights.map((i, idx) =>
          `${idx + 1}. "${i.headline}" - ${i.key_insight || i.summary || i.subtitle || 'No details'}`
        ).join('\n')}`
      : '';

    const roundtableContext = roundtableInsights.length > 0
      ? `\n**ROUNDTABLE INSIGHTS (From high-performing tweet analysis):**\n${roundtableInsights.map((i, idx) => {
          const avgCuriosityGap = Math.round((i.grokAnalysis.curiosityGap.score + i.claudeAnalysis.curiosityGap.score) / 2);
          const avgPredViolation = Math.round((i.grokAnalysis.predictionViolation.score + i.claudeAnalysis.predictionViolation.score) / 2);
          const takeaway = i.takeaways?.[0]?.takeaway || '';
          return `${idx + 1}. @${i.tweet.author}: "${i.tweet.text.slice(0, 100)}..."
     - Curiosity Gap: ${avgCuriosityGap}/10, Prediction Violation: ${avgPredViolation}/10
     - Key insight: ${i.claudeAnalysis.keyInsight}
     ${takeaway ? `- Takeaway: ${takeaway}` : ''}`;
        }).join('\n\n')}`
      : '';

    const userMessage = `**DRAFT TO ELEVATE:**
"${draft}"

${pulseContext}
${roundtableContext}

Please elevate this tweet using the psychological principles and any relevant insights. Return JSON only.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: ELEVATE_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      throw new Error('Failed to elevate tweet');
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr);
      return NextResponse.json(result);
    }

    // Fallback if no JSON found
    return NextResponse.json({
      elevatedTweet: responseText,
      psychologyApplied: null,
      insightsUsed: [],
      changes: 'Could not parse structured response',
    });
  } catch (error) {
    console.error('Error elevating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to elevate tweet' },
      { status: 500 }
    );
  }
}
