import { NextRequest, NextResponse } from 'next/server';
import { GROK_SYSTEM_PROMPT } from '@/prompts/grok-system';

export async function POST(request: NextRequest) {
  try {
    const { query, diaryContext } = await request.json();

    // Get API key from request header (sent from client localStorage)
    const grokApiKey = request.headers.get('x-grok-api-key');

    if (!grokApiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured. Add it in Settings.' },
        { status: 401 }
      );
    }

    // Build the user prompt - casual, like texting a friend
    let userPrompt = '';

    if (query) {
      // On-demand search for specific topic
      userPrompt = `Hey, can you check what's happening on X about "${query}"?

Look for:
- Who's talking about it (drop the @handles)
- Any tweets getting traction - quote them if they're good
- What angle is missing that could be interesting to explore
- Is it worth jumping in today or nah?

Keep it real - if nothing interesting is happening, just say so.`;
    } else {
      // Daily cultural pulse
      userPrompt = `What's happening on X today that I should know about?

Focus on US tech/creator scene - AI, content creation, ambitious women, work-life balance, building in public. Oh and anything from Steven Bartlett or Diary of a CEO crew.

${diaryContext ? `\nFor context, here's what I've been thinking about lately:\n${diaryContext}` : ''}

Show me actual tweets if something's popping - quote them with the @handle and engagement if it's notable. Tell me if there's a gap I could fill or a conversation worth joining.

Don't give me everything - just the stuff that actually matters.`;
    }

    // Call xAI Grok API with Live Search (search_parameters approach)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        messages: [
          { role: 'system', content: GROK_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        // Live Search API - searches X, news, web (US focused)
        search_parameters: {
          mode: 'on',
          sources: [
            { type: 'x' },
            { type: 'news', country: 'US' },
            { type: 'web', country: 'US' }
          ],
          max_search_results: 20,
          return_citations: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', errorText);
      return NextResponse.json(
        { error: `Grok API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Grok response:', JSON.stringify(data, null, 2));

    const briefContent = data.choices?.[0]?.message?.content || 'No response from Grok';
    const citations = data.citations || [];

    // Parse the response to extract structured data for bento boxes
    const structured = parseGrokResponse(briefContent);

    return NextResponse.json({
      brief: briefContent,
      citations,
      ...structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}

// Parse Grok's response to extract counts for bento display
function parseGrokResponse(content: string) {
  // Count mentions of trends, people, debates based on patterns
  const trendMatches = content.match(/trending|trend|📈|🔥/gi) || [];
  const peopleMatches = content.match(/@\w+/g) || [];
  const debateMatches = content.match(/debate|discussion|conversation|perspectives/gi) || [];
  const urgentMatches = content.match(/HIGH URGENCY|post today|⚡|urgent/gi) || [];

  // Get unique handles
  const uniqueHandles = [...new Set(peopleMatches)];

  return {
    stats: {
      trends: Math.min(trendMatches.length, 10),
      people: uniqueHandles.length,
      debates: Math.min(Math.ceil(debateMatches.length / 2), 5),
      urgent: urgentMatches.length > 0,
    },
    handles: uniqueHandles.slice(0, 5),
  };
}
