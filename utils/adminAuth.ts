/**
 * Shared-passcode gate for the manual stats form and admin area.
 *
 * The team passcode lives in the ADMIN_KEY env var. Entering it sets an
 * HttpOnly cookie holding sha256(ADMIN_KEY), which is compared on each
 * request — so the passcode itself is never stored client-side.
 */
import { createHash } from 'node:crypto';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const COOKIE_NAME = 'dase_admin';

function adminKey(): string {
    return process.env.ADMIN_KEY || '';
}

function keyHash(): string {
    return createHash('sha256').update(adminKey()).digest('hex');
}

export function isAdminConfigured(): boolean {
    return adminKey().length > 0;
}

export function isAdminAuthed(c: Context): boolean {
    if (!isAdminConfigured()) return false;
    return getCookie(c, COOKIE_NAME) === keyHash();
}

/** Returns true (and sets the session cookie) if the passcode matches. */
export function tryAdminLogin(c: Context, passcode: string): boolean {
    if (!isAdminConfigured() || passcode !== adminKey()) return false;
    setCookie(c, COOKIE_NAME, keyHash(), {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return true;
}

export function adminLogout(c: Context): void {
    deleteCookie(c, COOKIE_NAME, { path: '/' });
}
