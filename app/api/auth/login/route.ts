import { NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { generateToken, setTokenCookie } from '@/lib/auth/jwt';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/security/rate-limit';
import { loginSchema, validateSchema } from '@/lib/validation/schemas';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { getUserByEmail, updateUser } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(identifier, RateLimitConfigs.login);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60); // minutes
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${resetIn} minute${resetIn > 1 ? 's' : ''}.`
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateSchema(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data!;

    // Find user by email
    const user = await getUserByEmail(email);

    if (!user) {
      // Log failed login attempt
      await createAuditLog({
        action: 'auth.login.failed',
        severity: 'warning',
        ...getUserInfoFromRequest(request),
        userEmail: email,
        success: false,
        error: 'User not found',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has password set
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'This account does not have a password set. Please contact an administrator.' },
        { status: 401 }
      );
    }

    // Verify password (with migration support)
    const passwordResult = await verifyPassword(password, user.passwordHash);

    if (!passwordResult.valid) {
      // Log failed login attempt
      await createAuditLog({
        action: 'auth.login.failed',
        severity: 'warning',
        ...getUserInfoFromRequest(request, user),
        success: false,
        error: 'Invalid password',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Migrate password hash to bcrypt if needed
    if (passwordResult.needsMigration) {
      try {
        const newHash = await hashPassword(password);
        await updateUser(user.id, { passwordHash: newHash });
        console.log(`Migrated password hash for user: ${user.email}`);
      } catch (error) {
        console.error('Failed to migrate password hash:', error);
        // Continue with login even if migration fails
      }
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.email, user.name, user.role);

    // Set token as HTTP-only cookie
    await setTokenCookie(token);

    // Log successful login
    await createAuditLog({
      action: 'auth.login.success',
      severity: 'info',
      ...getUserInfoFromRequest(request, user),
      success: true,
    });

    // Return user data (without password or token)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedZoneIds: user.assignedZoneIds || [],
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
