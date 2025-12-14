import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // OAuth callback - redirect to home
  return NextResponse.redirect(new URL('/tournaments', requestUrl.origin));
}
