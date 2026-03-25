import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simply pass through all requests - authentication is handled in server components
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
