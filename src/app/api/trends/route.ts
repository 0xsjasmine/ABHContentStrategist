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

    // Build the user prompt
    let userPrompt = '';

    if (query) {
      // On-demand search for specific topic
      userPrompt = `Search X and the web for recent conversations about: "${query}"

Provide:
1. Current volume/mentions if available
2. Top voices discussing this (with @handles)
3. Main perspectives in the conversation
4. What's MISSING that the user could uniquely add
5. Any viral posts or heated debates
6. Suggested entry points

Be specific with real data from your search.`;
    } else {
      // Daily cultural brief
      userPrompt = `Search X right now for today's cultural intelligence brief.

Focus on finding:
1. TOP 5 TRENDING TOPICS relevant to AI, content creation, ambitious women, work-life balance, building in public
2. TOP 3 TRENDING PEOPLE posting about these topics (include @handles)
3. 1-2 ACTIVE DEBATES worth joining
4. Any HIGH URGENCY opportunities (post today)

${diaryContext ? `\nUser's recent diary themes to match against:\n${diaryContext}` : ''}

Use real data from your X search. Include actual engagement numbers where possible.
Format as a conversational brief - like you're a smart cultural strategist giving a morning update.`;
    }

    // Call xAI Grok API with Agentic Search Tools
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
        // Agentic Search Tools - using function type with tool names
        tools: [
          {
            type: 'function',
            function: {
              name: 'x_search',
              description: 'Search X posts and threads'
            }
          },
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web'
            }
          }
        ]
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
