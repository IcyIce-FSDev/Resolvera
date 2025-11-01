import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { generateToken, setTokenCookie } from '@/lib/auth/jwt';
import { createUserSchema, validateSchema } from '@/lib/validation/schemas';
import { getAllUsers, createUser } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = validateSchema(createUserSchema, body);
    if (!validation.success) {
      // Check if password validation failed
      const passwordError = validation.errors?.find(err => err.path === 'password');
      if (passwordError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid formatted password',
          },
          { status: 400 }
        );
      }

      // For other validation errors, return the first error message
      return NextResponse.json(
        {
          success: false,
          error: validation.errors?.[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data!;

    // Check if users already exist
    const existingUsers = await getAllUsers();
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Setup has already been completed' },
        { status: 400 }
      );
    }

    // Hash password using the standard library
    const passwordHash = await hashPassword(password);

    // Create admin user in database
    const adminUser = await createUser({
      name,
      email,
      passwordHash,
      role: 'admin',
      assignedZoneIds: [], // Admin has access to all zones
    });

    // Generate JWT token and set cookie
    const token = await generateToken(adminUser.id, adminUser.email, adminUser.name, adminUser.role);
    await setTokenCookie(token);

    // Return user data (without password)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          assignedZoneIds: adminUser.assignedZoneIds,
        },
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during setup' },
      { status: 500 }
    );
  }
}
