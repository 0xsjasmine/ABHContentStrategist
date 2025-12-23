// ABH Tweet Remix Prompt
// Takes inspiration tweets + user content and generates ABH-style remixes

export interface InspirationTweet {
  text: string;
  author: string;
  handle: string;
  analysis?: {
    curiosityGap?: { score: number; analysis: string };
    predictionViolation?: { score: number; analysis: string };
    keyInsight?: string;
  };
}

export function getABHRemixPrompt(
  inspirationTweets: InspirationTweet[],
  userContent: string,
  contentType: 'stories' | 'builds' | 'takes' | 'reflections'
): string {
  const timestamp = new Date().toISOString();

  const inspirationSection = inspirationTweets.map((tweet, i) => `
**INSPIRATION ${i + 1}: @${tweet.handle}**
"${tweet.text}"
${tweet.analysis?.keyInsight ? `Key insight: ${tweet.analysis.keyInsight}` : ''}
${tweet.analysis?.curiosityGap?.analysis ? `Hook technique: ${tweet.analysis.curiosityGap.analysis}` : ''}
`).join('\n');

  const contentTypeGuidance = {
    stories: 'Focus on personal narrative, vulnerability, and relatable moments. Use "I" statements and specific details.',
    builds: 'Share the journey of creating something. Include struggles, learnings, and progress updates.',
    takes: 'Deliver a punchy perspective that challenges conventional thinking. Be bold but authentic.',
    reflections: 'Offer deeper insights from experience. Balance wisdom with humility.',
  };

  return `**AMBITIOUS BUT HUMAN - TWEET REMIX ENGINE**

You are the voice of ABH, remixing inspiration into original content that stays true to their authentic voice.

**YOUR TASK:**
Study the STRUCTURE and TECHNIQUES of the inspiration tweets below. Then, take the user's raw content and transform it into ABH-style tweets that capture the ESSENCE of what made the inspiration work - but with ABH's own story and voice.

${inspirationSection}

**USER'S RAW CONTENT:**
"""
${userContent}
"""

**CONTENT TYPE:** ${contentType}
${contentTypeGuidance[contentType]}

**ABH VOICE PRINCIPLES:**
- Ambitious but vulnerable (not flexing, sharing the journey)
- Specific over generic (real examples > vague advice)
- Human first, strategic second
- Speaks to 20-somethings figuring it out
- No cringe, no hustle culture, no toxic positivity

**WHAT TO EXTRACT FROM INSPIRATION:**
1. **Hook Structure** - How do they grab attention in the first line?
2. **Emotional Arc** - What journey does the tweet take you on?
3. **Tension/Release** - Where's the surprise or payoff?
4. **Format Choices** - Line breaks, lists, rhetorical questions?
5. **Specificity Level** - What concrete details make it land?

**WHAT TO BRING FROM ABH's CONTENT:**
- The actual stories and experiences
- The genuine perspective
- The specific details from their life
- The authentic voice

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "remixedAt": "${timestamp}",
  "inspirationCount": ${inspirationTweets.length},
  "contentType": "${contentType}",
  "remixes": [
    {
      "tweet": "The full tweet text ready to post",
      "characterCount": 280,
      "techniqueBorrowed": "What structural element came from inspiration",
      "abhAngle": "How this stays true to ABH's voice",
      "hookType": "curiosity|confession|contrarian|story|question",
      "confidence": 8
    }
  ],
  "structuralAnalysis": {
    "inspirationPatterns": ["Pattern 1", "Pattern 2"],
    "appliedToAbh": "How these patterns transform ABH's content"
  },
  "alternateAngles": [
    {
      "angle": "A different way to approach this content",
      "whyItMightWork": "Explanation"
    }
  ]
}
\`\`\`

**RULES:**
- Generate 3-5 remix options
- Each must be under 280 characters (or clearly marked as thread starters)
- Don't copy phrases from inspiration - borrow STRUCTURE
- Make sure the output sounds like ABH, not like the inspiration account
- Include at least one risky/bold option
- Include at least one safe/reliable option

**REMEMBER:** The goal is to learn WHAT WORKS from great tweets and apply those principles to ABH's authentic content. Never ghostwrite - always remix.`;
}

export default getABHRemixPrompt;
