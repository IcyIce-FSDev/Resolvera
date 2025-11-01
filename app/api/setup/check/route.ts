import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db/database';

// Check if setup is needed (no authentication required for this endpoint)
// This endpoint is intentionally public to allow the login page to determine
// if initial setup is needed. It only returns a boolean, not user data.
export async function GET() {
  try {
    const users = await getAllUsers();
    const needsSetup = !users || users.length === 0;

    return NextResponse.json({
      success: true,
      needsSetup,
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check setup status',
      },
      { status: 500 }
    );
  }
}
