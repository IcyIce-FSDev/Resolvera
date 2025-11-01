import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRequestUser, AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    const user = getRequestUser(req);

    return NextResponse.json({
      success: true,
      data: { user },
    });
  });
}
