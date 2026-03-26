import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple pass-through middleware
  // Auth session handling is done in server components/actions
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
