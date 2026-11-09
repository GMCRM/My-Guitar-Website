import { NextResponse } from 'next/server';

const CHANNEL_ID = 'UCzwxT1G7fKteEkiSge9Gk-w'; // youtube.com/@grantmataicross8825
const CACHE_SECONDS = 3600;

/** Public YouTube subscriber count, or null when it is unavailable. */
export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ count: null });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'statistics');
    url.searchParams.set('id', CHANNEL_ID);
    url.searchParams.set('key', apiKey);

    // Cached so page views don't spend API quota.
    const response = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!response.ok) {
      console.error('YouTube API returned status', response.status);
      return NextResponse.json({ count: null });
    }

    const data = await response.json();
    const raw = data.items?.[0]?.statistics?.subscriberCount;
    const count = raw === undefined ? null : Number(raw);
    return NextResponse.json({ count: Number.isFinite(count) ? count : null });
  } catch (error) {
    console.error('Failed to fetch YouTube subscriber count:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ count: null });
  }
}
