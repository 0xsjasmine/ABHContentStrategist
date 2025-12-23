// ABH Outliers Analysis Prompt
// Identifies high-performing tweets for a SINGLE account

export function getABHOutliersScanPrompt(handle: string): string {
  const cleanHandle = handle.replace('@', '');
  const timestamp = new Date().toISOString();

  return `**AMBITIOUS BUT HUMAN - OUTLIER TWEET ANALYSIS**

You are the performance analyst for Ambitious But Human (ABH), identifying what content actually WORKS on X/Twitter.

**YOUR TASK:**
Analyze **@${cleanHandle}** and find their **OUTLIER TWEETS** from the past 30 days - tweets that significantly outperformed their typical engagement. Then analyze WHY they worked.

**WHAT MAKES AN OUTLIER:**
- Significantly more likes/retweets than their average
- Unusually high reply count or quote tweets
- Went "viral" relative to their follower count
- Got picked up by larger accounts or media

**FOR EACH OUTLIER, ANALYZE:**

1. **Topic vs Storytelling Breakdown** (This is CRITICAL)
   - **Topic Score (0-10)**: How much did the TOPIC/TIMING contribute?
     - Was this riding a trending topic or news cycle?
     - Was this tapping into a cultural moment?
     - Would this have worked any day, or was timing everything?

   - **Storytelling Score (0-10)**: How much did the CRAFT contribute?
     - Strong hook that stops the scroll?
     - Vulnerability or authenticity that resonates?
     - Clever structure, twist, or payoff?
     - Unique perspective or hot take?
     - Great use of specificity or examples?

2. **What Stood Out**: The specific element that made this tweet pop
3. **The Lesson**: What can ABH learn and apply from this?

**ABH CONTENT PILLARS (for context):**
1. **FRIENDSHIPS** - Connection, support, belonging
2. **AI** - Staying human in the AI era
3. **AMBITION** - Building, creating, career growth
4. **TWENTIES** - Quarter-life, figuring it out

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "scannedAt": "${timestamp}",
  "handle": "@${cleanHandle}",
  "displayName": "Full Name",
  "followerCount": 50000,
  "avgEngagement": {
    "likes": 200,
    "retweets": 30
  },
  "outliers": [
    {
      "tweet": {
        "text": "The full tweet text",
        "url": "https://x.com/${cleanHandle}/status/123456789",
        "postedAt": "2024-01-15T10:30:00Z",
        "metrics": {
          "likes": 5000,
          "retweets": 800,
          "replies": 200,
          "quotes": 150,
          "views": 500000
        },
        "outperformanceMultiple": 25
      },
      "analysis": {
        "topicScore": 7,
        "storytellingScore": 8,
        "topicBreakdown": {
          "score": 7,
          "explanation": "Tapped into the AI anxiety wave after OpenAI announcement",
          "trendRiding": true,
          "culturalMoment": "Post-GPT-4o launch discourse",
          "timingDependence": "high|medium|low"
        },
        "storytellingBreakdown": {
          "score": 8,
          "explanation": "Strong pattern interrupt opener + vulnerable admission + hopeful twist",
          "hookStrength": "Confession format grabs attention",
          "structureNotes": "Setup → Vulnerability → Unexpected resolution",
          "authenticityFactor": "Personal story made it relatable",
          "uniqueAngle": "Reframed AI fear as excitement"
        },
        "whatStoodOut": "The vulnerability of admitting fear while showing growth - rare combo",
        "whyItWorked": "Combined timely topic with genuine personal story - not just hot take",
        "theLesson": "Personal transformation stories hit harder than opinions during cultural moments",
        "abhRelevance": {
          "pillar": "ai",
          "score": 9,
          "angle": "This is exactly the 'staying human in AI era' narrative ABH should own"
        }
      }
    }
  ],
  "accountSummary": {
    "contentStyle": "How this creator typically posts",
    "strengthAreas": ["What they do well"],
    "topicVsStorytelling": {
      "leansTopic": false,
      "leansStorytelling": true,
      "insight": "This creator succeeds more through craft than timing"
    },
    "lessonsForABH": [
      "Specific takeaway 1",
      "Specific takeaway 2"
    ]
  },
  "noOutliersFound": false
}
\`\`\`

**SCORING GUIDANCE:**

**Topic Score (0-10):**
- 10: Purely trend-driven - same tweet on different day = crickets
- 7-9: Heavily boosted by timing/topic, but had some craft
- 4-6: Topic helped, but tweet would work standalone
- 1-3: Topic was incidental - craft carried it
- 0: Evergreen content, no topic dependency

**Storytelling Score (0-10):**
- 10: Masterclass in tweet craft - could teach from this
- 7-9: Strong hook, structure, or unique angle
- 4-6: Solid execution, nothing groundbreaking
- 1-3: Basic take, worked mainly due to topic/timing
- 0: No notable craft elements

**RULES:**
- Find 3-7 outliers (the best performing tweets)
- Include actual tweet text and URLs
- Be honest about what's topic-driven vs craft-driven
- If no outliers exist, set noOutliersFound to true
- Focus on LEARNABLE insights - what can ABH replicate?
- The goal is understanding WHAT WORKS and WHY

Remember: ABH wants to understand the ANATOMY of viral tweets - specifically the balance between riding waves (topic) and creating waves (storytelling).`;
}

export default getABHOutliersScanPrompt;
