// xAI (Grok) API Client for ABH Command Center
// Uses the correct /v1/responses endpoint with tools

const XAI_API_URL = 'https://api.x.ai/v1/responses';
const XAI_MODEL = 'grok-4-fast';

export interface XAIRequestOptions {
  prompt: string;
  apiKey: string;
  searchDays?: number; // How many days back to search (default 7)
  includeWebSearch?: boolean;
  includeXSearch?: boolean;
}

export interface XAIResponse {
  success: boolean;
  content: string;
  citations: any[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
}

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function callXAI(options: XAIRequestOptions): Promise<XAIResponse> {
  const {
    prompt,
    apiKey,
    searchDays = 7,
    includeWebSearch = true,
    includeXSearch = true,
  } = options;

  if (!apiKey) {
    return {
      success: false,
      content: '',
      citations: [],
      error: 'XAI_API_KEY not provided',
    };
  }

  // Build tools array
  const tools: any[] = [];

  if (includeWebSearch) {
    tools.push({ type: 'web_search' });
  }

  if (includeXSearch) {
    tools.push({
      type: 'x_search',
      from_date: getDateDaysAgo(searchDays),
      to_date: getDateDaysAgo(0),
    });
  }

  const requestBody = {
    model: XAI_MODEL,
    input: [{ role: 'user', content: prompt }],
    tools: tools.length > 0 ? tools : undefined,
  };

  console.log(`[xAI] Calling ${XAI_MODEL} with ${tools.length} tools`);

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[xAI] API error: ${response.status}`, errorText);
      return {
        success: false,
        content: '',
        citations: [],
        error: `xAI API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Parse response - xAI has a different response structure
    let responseContent = '';
    let citations: any[] = [];

    if (data.output) {
      // New response format
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text') {
              responseContent += content.text;
            }
          }
        }
      }
      citations = data.citations || [];
    } else if (data.choices && data.choices[0]) {
      // Fallback to old format
      responseContent = data.choices[0].message?.content || '';
      citations = data.citations || [];
    }

    if (!responseContent) {
      return {
        success: false,
        content: '',
        citations: [],
        error: 'No response content from xAI',
      };
    }

    console.log(`[xAI] Got response (${responseContent.length} chars, ${citations.length} citations)`);

    return {
      success: true,
      content: responseContent,
      citations,
      usage: {
        inputTokens: data.usage?.input_tokens || Math.ceil(prompt.length / 4),
        outputTokens: data.usage?.output_tokens || Math.ceil(responseContent.length / 4),
      },
    };
  } catch (error: any) {
    console.error('[xAI] Error:', error);
    return {
      success: false,
      content: '',
      citations: [],
      error: error.message,
    };
  }
}

// Helper to extract JSON from markdown code blocks
export function extractJSON<T>(content: string): T | null {
  try {
    // Try to extract from markdown code blocks first
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.log('[xAI] Could not parse JSON from response');
    return null;
  }
}

export { XAI_API_URL, XAI_MODEL };
