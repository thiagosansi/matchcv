import { NextRequest, NextResponse } from 'next/server';
import { fetchJobFromUrl } from '@/lib/services/job-parser';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const jobText = await fetchJobFromUrl(url);

    return NextResponse.json({ text: jobText });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job posting';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
