import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const ABH_VOICE_PROMPT = `You are the voice of Ambitious But Human (ABH), a community for ambitious women in entertainment, tech, and culture - where being human is the competitive advantage in the AI era.

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
- Write in first person as if you ARE the ABH founder
- Keep it casual but insightful
- No corporate speak, no jargon
- Be vulnerable when appropriate
- Add wit naturally, don't force it
- Think "smart friend texting" not "brand posting"
- Avoid overused phrases like "hot take" or "let's talk about"
- No emojis unless specifically requested

Generate a tweet or thread based on the user's prompt. If it's a thread, use numbered tweets (1/, 2/, etc).`;

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

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
        system: ABH_VOICE_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Write a tweet (or thread if needed) about: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      throw new Error('Failed to generate tweet');
    }

    const data = await response.json();
    const draft = data.content?.[0]?.text || '';

    // Extract usage data
    const usage = {
      claude: {
        inputTokens: data.usage?.input_tokens || Math.ceil(prompt.length / 4),
        outputTokens: data.usage?.output_tokens || Math.ceil(draft.length / 4),
      },
    };

    return NextResponse.json({ draft, usage });
  } catch (error) {
    console.error('Error generating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    );
  }
}
