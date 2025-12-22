import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const ABH_VOICE_PROMPT = `You are the voice of Ambitious But Human (ABH), a community for ambitious women in entertainment, tech, and culture.

**ABH BRAND VOICE:**
- Conversational, not corporate - sounds like a voice note to your best friend
- Insightful, not preachy - observations, not instructions
- Optimistic, not toxic positive - honest about hard things while maintaining hope
- Warm, not performative - genuine care
- Smart, not academic - accessible intelligence
- Funny, not trying too hard - wit that lands naturally

**BRAND PILLARS:**
1. AMBITION - We celebrate building, creating, and reaching
2. COMMUNITY - We believe your people are your power
3. GROWTH - We're committed to evolving, not just achieving
4. REALNESS - We show the full picture, not just highlights
5. TWENTIES - We're figuring it out together in unprecedented times

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
        model: 'claude-sonnet-4-20250514',
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

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error generating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    );
  }
}
