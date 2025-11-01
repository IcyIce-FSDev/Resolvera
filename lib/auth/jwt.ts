// JWT token generation and verification utilities
// Uses jose library for secure JWT operations

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_COOKIE_NAME = 'resolvera_token';
const JWT_EXPIRATION = '24h'; // 24 hours

// Validate JWT_SECRET at module load time
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Application cannot start without it.');
}

if (JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters long for security. Current length: ' + JWT_SECRET.length);
}

// Convert secret string to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  assignedZoneIds?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown; // Index signature for jose compatibility
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: string, email: string, name: string, role: string): Promise<string> {
  const payload: JWTPayload = {
    userId,
    email,
    name,
    role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Set JWT token as HTTP-only cookie
 */
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // Allow HTTP for self-hosted deployments (enable HTTPS via reverse proxy)
    sameSite: 'lax', // 'lax' allows cookie to work across IP addresses and domains
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/',
  });
}

/**
 * Get JWT token from HTTP-only cookie
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(JWT_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Clear JWT token cookie
 */
export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}

/**
 * Get current user from JWT token in cookie
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookie();

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}
