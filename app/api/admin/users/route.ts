import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { createUserSchema, validateSchema } from '@/lib/validation/schemas';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { hashPassword } from '@/lib/auth/password';
import { getAllUsers, createUser, getUserByEmail } from '@/lib/db/database';

// Get all users (admin only)
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (_req: AuthenticatedRequest) => {
    try {
      const users = await getAllUsers();

      // Remove password hashes from response
      const safeUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedZoneIds: user.assignedZoneIds || [],
        createdAt: user.createdAt,
      }));

      return NextResponse.json({
        success: true,
        data: {
          users: safeUsers,
          count: safeUsers.length,
        },
      });
    } catch (error) {
      console.error('Error reading users:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read users',
        },
        { status: 500 }
      );
    }
  });
}

// Create a new user (admin only)
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

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

      const { name, email, password, role, assignedZoneIds } = validation.data!;

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        // Log failed user creation attempt
        const adminUser = getRequestUser(req);
        await createAuditLog({
          action: 'user.created',
          severity: 'warning',
          ...getUserInfoFromRequest(request, adminUser),
          resource: email,
          details: { email, attemptedRole: role || 'user' },
          success: false,
          error: 'User with this email already exists',
        });

        return NextResponse.json(
          {
            success: false,
            error: 'User with this email already exists',
          },
          { status: 400 }
        );
      }

      // Hash password using the standard library
      const hashedPassword = await hashPassword(password);

      // Create new user in database
      const newUser = await createUser({
        name,
        email,
        passwordHash: hashedPassword,
        role: role || 'user',
        assignedZoneIds: assignedZoneIds || [],
      });

      // Log successful user creation
      const adminUser = getRequestUser(req);
      await createAuditLog({
        action: 'user.created',
        severity: 'info',
        ...getUserInfoFromRequest(request, adminUser),
        resource: newUser.name,
        resourceId: newUser.id,
        details: {
          createdUserEmail: newUser.email,
          createdUserName: newUser.name,
          createdUserRole: newUser.role,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          assignedZoneIds: newUser.assignedZoneIds,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
        },
        { status: 500 }
      );
    }
  });
}
