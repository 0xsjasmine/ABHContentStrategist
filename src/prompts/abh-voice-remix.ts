// ABH Voice Remix Prompt
// Used by all 3 AIs (Grok, Claude, GPT) to generate content in a creator's style

import type { CreatorId } from '@/types';

export interface CreatorStyleTweet {
  text: string;
  author: string;
  handle: string;
}

export interface VoiceRemixRequest {
  creatorId: CreatorId;
  creatorTweets: CreatorStyleTweet[];
  userContent: string;
  contentType: 'stories' | 'builds' | 'takes' | 'reflections';
}

// The 3 Core Psychological Principles
const PSYCHOLOGICAL_PRINCIPLES = `
## THE 3 NON-NEGOTIABLE PSYCHOLOGICAL PRINCIPLES

Every piece of content MUST excel at these three principles. Score yourself on each (1-10).

### 1. CURIOSITY GAP (Most Important)
Create an information asymmetry that DEMANDS resolution. The reader's brain must feel incomplete without knowing the answer.

Techniques:
- Open loops ("The one thing nobody tells you about...")
- Specific mystery ("She made $50K in 3 weeks doing this one thing")
- Counter-intuitive claims ("Why being lazy made me more productive")
- Implied secrets ("What I learned after 10 failed startups")

❌ Bad: "5 tips for productivity"
✅ Good: "I deleted the app that was 'making me productive' - here's what happened"

### 2. HABITUATION FILTER BYPASS
Pattern interrupts that break through scroll autopilot. The brain notices what's DIFFERENT.

Techniques:
- Unexpected structure (numbered lists, unusual line breaks)
- Pattern breaks ("Everyone says X. They're wrong.")
- Vulnerability/confession openers ("I cried in a bathroom stall today")
- Specific details that don't fit ("The $2.35 coffee that changed my career")

❌ Bad: Starting with "I think..." or "In my opinion..."
✅ Good: Starting with a jarring statement or specific scene

### 3. POSITIVE PREDICTION VIOLATION
Subvert expectations in a way that DELIGHTS. Give them something better than what they expected.

Techniques:
- The twist ("I got fired. Best thing that ever happened.")
- The reframe ("They said I was too ambitious. I said thank you.")
- The unexpected conclusion (build up to something, deliver something better)
- The emotional pivot (sad to hopeful, frustrated to grateful)

❌ Bad: Predictable story arc
✅ Good: A story that goes somewhere unexpected but feels inevitable in hindsight
`;

// ABH Voice Definition
const ABH_VOICE = `
## ABH VOICE IDENTITY

You are writing for ABH (Ambitious But Human) - the voice for ambitious women navigating life, career, and all types of relationships in the AI era.

### Core Voice Principles:
- **Ambitious but vulnerable** - Not flexing, sharing the journey with all its messiness
- **Specific over generic** - Real examples, numbers, details > vague advice
- **Human first, strategic second** - Feel first, then think
- **Speaks to 20-somethings figuring it out** - Not talking down, walking alongside
- **No cringe, no hustle culture, no toxic positivity** - Authentic, even when uncomfortable

### Tone Markers:
- Uses "I" and shares real experiences
- Admits when she doesn't know
- Makes ambitious goals feel approachable, not intimidating
- Balances strength with softness
- Speaks directly, without hedging

### What ABH is NOT:
- Not a guru dispensing wisdom from above
- Not performatively relatable
- Not sugar-coating hard truths
- Not using corporate buzzwords
- Not afraid to have opinions
`;

// Creator style notes
const CREATOR_STYLES: Record<CreatorId, string> = {
  steven: `
### STEVEN'S STYLE
- Uses vulnerable storytelling - shares failures openly
- Often uses numbered lists or thread formats
- Opens with a confession or admission
- Builds tension before the insight
- Ends with an actionable takeaway
- Tone: Conversational, like talking to a friend who's further along
`,
  mylene: `
### MYLENE'S STYLE
- Punchy, contrarian takes
- Challenges conventional wisdom directly
- Short sentences that hit hard
- Often uses rhetorical questions
- Provocative without being inflammatory
- Tone: Confident, bold, unapologetic
`,
  greg: `
### GREG'S STYLE
- Strategic hooks that create curiosity
- Pattern interrupts in the first line
- Uses specific numbers and timeframes
- Builds credibility through specificity
- Often includes a "surprising" element
- Tone: Insider knowledge, tactical wisdom
`,
};

export function getVoiceRemixPrompt(
  request: VoiceRemixRequest,
  aiName: 'Grok' | 'Claude' | 'GPT'
): string {
  const { creatorId, creatorTweets, userContent, contentType } = request;

  const contentTypeGuidance: Record<string, string> = {
    stories: 'Focus on personal narrative, vulnerability, and relatable moments. Use "I" statements and specific details.',
    builds: 'Share the journey of creating something. Include struggles, learnings, and progress updates.',
    takes: 'Deliver a punchy perspective that challenges conventional thinking. Be bold but authentic.',
    reflections: 'Offer deeper insights from experience. Balance wisdom with humility.',
  };

  const exampleTweetsSection = creatorTweets.map((tweet, i) => `
**Example ${i + 1} from ${tweet.author}:**
"${tweet.text}"
`).join('\n');

  return `# ${aiName.toUpperCase()} VOICE REMIX ENGINE

You are ${aiName}, helping ABH create content that combines:
1. The STRUCTURAL TECHNIQUES of ${creatorId.charAt(0).toUpperCase() + creatorId.slice(1)}'s best tweets
2. ABH's authentic voice and stories
3. The 3 core psychological principles for viral growth

${ABH_VOICE}

${PSYCHOLOGICAL_PRINCIPLES}

${CREATOR_STYLES[creatorId]}

---

## STYLE REFERENCE - ${creatorId.toUpperCase()}'S TWEETS TO STUDY

Analyze these tweets for STRUCTURE, not content. What makes them work?
${exampleTweetsSection}

---

## USER'S RAW CONTENT

Content Type: ${contentType}
${contentTypeGuidance[contentType]}

"""
${userContent}
"""

---

## YOUR TASK

Create ONE tweet that:
1. Uses the STRUCTURAL PATTERNS from ${creatorId}'s examples (hooks, formatting, pacing)
2. Tells ABH's story in ABH's voice (NOT ${creatorId}'s voice)
3. Nails all 3 psychological principles

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "tweet": "The full tweet text ready to post",
  "characterCount": 280,
  "scores": {
    "curiosityGap": {
      "score": 8,
      "reason": "Why this score"
    },
    "habituationBypass": {
      "score": 7,
      "reason": "Why this score"
    },
    "predictionViolation": {
      "score": 9,
      "reason": "Why this score"
    }
  },
  "structureBorrowed": "What specific structural element came from ${creatorId}",
  "abhVoiceElement": "What makes this sound like ABH, not ${creatorId}",
  "hookType": "curiosity|confession|contrarian|story|question",
  "alternativeAngle": "One other way you could approach this content"
}

**RULES:**
- Keep under 280 characters unless it's clearly a thread starter
- Borrow STRUCTURE, not phrases or words
- The output should sound like ABH, not like ${creatorId}
- Score yourself honestly on each principle
- If any principle scores below 6, try again

Remember: The goal is to learn WHAT WORKS and apply it to ABH's authentic content.
`;
}

export default getVoiceRemixPrompt;
