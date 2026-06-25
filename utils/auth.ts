import { event } from './event';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

// Parse cookies from request headers
export function parseCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    // Lambda function URLs send cookies as an array
    if (Array.isArray((event as any).cookies)) {
        (event as any).cookies.forEach((cookie: string) => {
            const [name, ...rest] = cookie.split('=');
            if (name) {
                cookies[name] = rest.join('=');
            }
        });
        return cookies;
    }
    
    // Fallback to header parsing for API Gateway
    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies[name] = rest.join('=');
        }
    });
    
    return cookies;
}

// Get GitHub token from cookie
export function getGitHubToken(): string | null {
    const cookies = parseCookies();
    return cookies['gh_token'] || null;
}

// Get current user info from cookie
export function getCurrentUser(): { login: string; avatar_url: string; isPro?: boolean } | null {
    const cookies = parseCookies();
    const userCookie = cookies['gh_user'];
    if (!userCookie) return null;
    
    try {
        return JSON.parse(decodeURIComponent(userCookie));
    } catch {
        return null;
    }
}

// Check if user has pro status (survives logout)
export function hasProStatus(): boolean {
    const cookies = parseCookies();
    return cookies['gc_pro'] === '1';
}

// Create secure cookie string
export function createCookie(name: string, value: string, maxAge: number = 86400 * 30): string {
    return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// Create cookie deletion string
export function deleteCookie(name: string): string {
    return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// GitHub OAuth URLs - pro users get private repo access
export function getGitHubAuthUrl(isPro: boolean = false): string {
    // Pro users get repo + read:org scope for private repo and org access
    // GitHub accepts space-separated scopes (URL encoded as %20)
    const scopes = isPro ? 'read:user repo read:org' : 'read:user';
    return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scopes)}`;
}

// Get pro auth URL (for re-auth after subscribing)
export function getGitHubProAuthUrl(): string {
    return getGitHubAuthUrl(true);
}

// Exchange code for token
export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; error?: string }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        }),
    });
    
    return response.json();
}

// Fallback tokens for unauthenticated users (5000 req/hour each)
const GITHUB_FALLBACK_TOKENS = [
    process.env.GITHUB_FALLBACK_TOKEN_1,
    process.env.GITHUB_FALLBACK_TOKEN_2,
    process.env.GITHUB_FALLBACK_TOKEN_3,
].filter(Boolean) as string[];

// Start from the first working token — bumped forward when tokens fail.
// Persists across requests in the same Lambda container (warm starts).
let firstWorkingTokenIndex = 0;

import { getGitHubCache, getStaleGitHubCache, setGitHubCache, deleteGitHubCache } from './db';

// Fetch from GitHub with optional auth and 60-min caching
// Falls back to stale cached data if all API attempts fail
export async function fetchGitHub(url: string, token?: string | null, skipCache = false) {
    // Check cache first (only for non-user-specific requests)
    if (!skipCache) {
        const cached = await getGitHubCache(url);
        if (cached) {
            return cached;
        }
    }
    
    // Try fetching fresh data
    const freshResult = await fetchGitHubFresh(url, token, skipCache);

    // If we got good data, return it
    if (freshResult && !freshResult.message && !freshResult.error) {
        return freshResult;
    }

    // Definitive 404 from GitHub means the resource genuinely doesn't exist anymore.
    // Don't fall back to stale cache (which would keep serving deleted content forever),
    // and proactively clear any cached entry so it can't be revived via stale lookups.
    if (freshResult?.message === 'Not Found') {
        if (!skipCache) {
            await deleteGitHubCache(url);
        }
        return freshResult;
    }

    // Fresh fetch failed for other reasons (rate limit, network) — try stale cache as last resort
    if (!skipCache) {
        const stale = await getStaleGitHubCache(url);
        if (stale) {
            return stale;
        }
    }

    // Nothing worked — return whatever we got (error or empty)
    return freshResult;
}

// Attempt a fresh fetch from GitHub API with token cycling
async function fetchGitHubFresh(url: string, token?: string | null, skipCache = false) {
    // If user has a token, use it directly
    if (token) {
        return fetchWithToken(url, token, skipCache);
    }
    
    // Start from the first known-working token
    for (let i = firstWorkingTokenIndex; i < GITHUB_FALLBACK_TOKENS.length; i++) {
        const result = await fetchWithToken(url, GITHUB_FALLBACK_TOKENS[i], skipCache);
        
        // If we got any error response, permanently skip this token
        if (result?.message) {
            console.log(`[GITHUB] Token ${i + 1} failed: ${result.message} — skipping permanently`);
            // Bump the starting index so ALL concurrent requests skip this token immediately
            if (i === firstWorkingTokenIndex) {
                firstWorkingTokenIndex = i + 1;
            }
            continue;
        }
        
        return result;
    }
    
    // All tokens exhausted or none configured — try public (no auth, 60 req/hour)
    console.log(`[GITHUB] All tokens failed, falling back to public API for ${url}`);
    return fetchWithToken(url, null, skipCache);
}

async function fetchWithToken(url: string, token: string | null, skipCache: boolean) {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DASE-Hub'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    // Only cache successful responses with actual data
    // Don't cache: errors, empty arrays, or rate limit responses
    const isError = data?.message || data?.error;
    const isEmpty = Array.isArray(data) && data.length === 0;
    const isUserEndpoint = url === 'https://api.github.com/user';
    const shouldCache = !skipCache && response.ok && !isUserEndpoint && !isError && !isEmpty;
    
    if (shouldCache) {
        await setGitHubCache(url, data);
    }
    
    return data;
}

// Fetch current user from GitHub (skip cache - user-specific)
export async function fetchCurrentUser(token: string) {
    return fetchGitHub('https://api.github.com/user', token, true);
}
