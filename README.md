# Ambitious But Human - Content Strategist

A minimalist content creation platform that transforms raw thoughts into high-performing X posts by intelligently connecting content across multiple sources: diary entries, book quotes, saved post formats, and real-time cultural trends.

## Core Philosophy

**Your diary voice is the foundation (70% weight, non-negotiable).** AI bridges your authentic thoughts with cultural relevance, inspirational quotes, and proven formats - creating posts with depth, timing, and structure while preserving your unique voice.

## Features

### Multi-Tab Intelligence System

- **📝 Diary Tab**: Your authentic voice (foundation, always preserved)
  - Free-form text editor with auto-timestamp
  - Entry types: Stories, Builds, Takes, Reflections
  - Tag system for organization
  - Content potential analysis

- **💡 Creator/Inspiration Tab**: Proven structures (format examples)
  - Save posts that resonate
  - Multi-tag system: topic, creator, format, vibe
  - Notes for personal annotations

- **📚 Books/Library Tab**: Soul and depth (quotes to weave in)
  - Store quotes with your takes
  - Theme tagging
  - Natural attribution in generated posts

- **📊 Data/Trends Tab**: Cultural timing (why post this NOW)
  - Daily brief with trending topics
  - Diary → trend matching
  - Opportunity scoring

- **💬 Reply Girl Tab**: Strategic engagement
  - Generate authentic replies
  - Multiple reply styles
  - Connected to diary for substance

### Content Generation

- Transparent sourcing (shows exactly what's pulled from each tab)
- Voice check verification (diary voice %)
- Multiple combination options
- 30/70 ambitious/human split maintained

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: IndexedDB via Dexie.js (local-first)
- **AI**: Anthropic Claude API
- **Trends**: xAI Grok API (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env.local` file:

```env
# Claude API for content generation (optional - works without for mock generation)
ANTHROPIC_API_KEY=sk-ant-...

# Grok API for trends (coming soon)
GROK_API_KEY=xai-...
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── analyze/       # Diary analysis endpoint
│   │   └── generate/      # Post generation endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── ui/                # Reusable UI components
│   ├── tabs/              # Tab components
│   ├── generation/        # Generation panel
│   └── Layout.tsx         # Main layout with navigation
├── lib/
│   ├── db.ts              # Dexie database setup
│   └── claude.ts          # Claude API integration
├── prompts/
│   ├── claude-system.ts   # Claude system prompt
│   └── grok-system.ts     # Grok system prompt
└── types/
    └── index.ts           # TypeScript type definitions
```

## Usage

1. **Write in Diary**: Capture your authentic thoughts
2. **Save Inspiration**: Paste posts you admire in Creator tab
3. **Add Quotes**: Save book quotes with your takes
4. **Generate**: Select a diary entry and generate posts with multi-tab intelligence

## Content Pillars

The platform is designed around these themes:

1. **AI scales the scalable** → double down on unscalable
2. **Life moves in seasons** → building/healing/exploring/resting
3. **Being human is the luxury** in AI abundance era
4. **Trade-offs are REAL** → acknowledging them gives permission
5. **Success without impact is meaningless**

## Development Roadmap

### Phase 1: MVP (Complete)
- Core writing + basic generation
- Diary, Creator, Books tabs
- Claude integration
- Notion-style UI

### Phase 2: Intelligence (Next)
- Grok API integration
- Daily automated briefs
- Trend matching
- On-demand search

### Phase 3: Engagement
- Reply Girl functionality
- Weekly strategy view
- SerpAPI integration
- Advanced filtering

### Phase 4: Polish
- Analytics dashboard
- Mobile responsive
- Performance optimization
- Export functionality

## License

Private - All rights reserved
