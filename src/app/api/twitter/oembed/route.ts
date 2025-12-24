import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Use Twitter's oEmbed API
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

    const response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract tweet text from HTML (basic extraction)
    let text = '';
    if (data.html) {
      // Extract text between <p> tags (using [\s\S] instead of /s flag for compatibility)
      const match = data.html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      if (match) {
        text = match[1]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      }
    }

    return NextResponse.json({
      ...data,
      text,
    });
  } catch (error: any) {
    console.error('[Twitter oEmbed] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tweet' },
      { status: 500 }
    );
  }
}
