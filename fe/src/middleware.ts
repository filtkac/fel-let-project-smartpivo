import { NextRequest, NextResponse } from 'next/server';

const AUTH_USER = "let";
const AUTH_PASS = "malina321";

function isAuthenticated(req: NextRequest) {
  const authheader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authheader) {
    return false;
  }

  const basicAuth = Buffer.from(authheader.split(' ')[1], 'base64').toString().split(':');
  const [user, pass] = basicAuth;
  return user === AUTH_USER && pass === AUTH_PASS;
}

export default function middleware(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic' },
    });
  }
}
