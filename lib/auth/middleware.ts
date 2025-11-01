// Authentication middleware for API routes
// Verifies JWT tokens and ensures proper authorization

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, JWTPayload } from './jwt';
import { getUserById } from '../db/database';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to require authentication for API routes
 * Verifies JWT token and attaches user info to request
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get and verify JWT token
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify user still exists in database and role hasn't changed
  try {
    const dbUser = await getUserById(user.userId);

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Update role from database (in case it changed)
    user.role = dbUser.role;
    user.email = dbUser.email;
    user.name = dbUser.name;
    user.assignedZoneIds = dbUser.assignedZoneIds || [];
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = user;

  // Call the handler
  return handler(authenticatedRequest);
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req) => {
    if (req.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Helper to get user from authenticated request
 */
export function getRequestUser(request: AuthenticatedRequest): JWTPayload {
  if (!request.user) {
    throw new Error('User not attached to request. Did you forget to use requireAuth?');
  }
  return request.user;
}
