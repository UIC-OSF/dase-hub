import type { Context } from 'hono';
import { deleteCookie as honoDeleteCookie } from 'hono/cookie';
import { 
    getGitHubAuthUrl,
    getGitHubProAuthUrl,
    exchangeCodeForToken, 
    fetchCurrentUser,
    getGitHubToken,
    hasProStatus
} from '#src/utils/auth';
import { getProUser } from '#src/utils/db';
import { renderPage } from '#src/utils/legacyLayout';

// Create cookie string for Lambda Function URLs
const makeCookie = (name: string, value: string, maxAge: number) => 
    `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

// For Lambda Function URLs, we need to return cookies in a specific format
// Hono's setCookie doesn't work properly with Lambda Function URLs
const redirectWithCookies = (location: string, cookies: string[]) => {
    const headers = new Headers({ 'Location': location });
    for (const cookie of cookies) {
        headers.append('Set-Cookie', cookie);
    }
    return new Response(null, { status: 302, headers });
};

// Redirect to GitHub OAuth
export const github = async (c: Context) => {
    // Check gc_pro cookie first (survives logout)
    if (hasProStatus()) {
        return c.redirect(getGitHubProAuthUrl(), 302);
    }
    
    // Check if user is already logged in and is pro - use pro scopes
    const token = getGitHubToken();
    let isPro = false;
    
    if (token) {
        try {
            const ghUser = await fetch('https://api.github.com/user', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'DASE-Hub'
                }
            }).then(r => r.json());
            
            if (ghUser.id) {
                const proUser = await getProUser(String(ghUser.id));
                isPro = proUser?.status === 'active';
            }
        } catch (e) {
            // Ignore
        }
    }
    
    const authUrl = isPro ? getGitHubProAuthUrl() : getGitHubAuthUrl();
    return c.redirect(authUrl, 302);
};

// Pro auth - always request private repo scope
export const githubPro = (c: Context) => {
    return c.redirect(getGitHubProAuthUrl(), 302);
};

// Handle GitHub OAuth callback
export const callback = async (c: Context) => {
    const code = c.req.query('code');
    
    if (!code) {
        return c.html(renderError('Missing authorization code'), 400);
    }
    
    try {
        // Exchange code for token
        const tokenResponse = await exchangeCodeForToken(code);
        
        if (tokenResponse.error || !tokenResponse.access_token) {
            return c.html(renderError(tokenResponse.error || 'Failed to get access token'), 400);
        }
        
        const token = tokenResponse.access_token;
        
        // Fetch user info
        const user = await fetchCurrentUser(token);
        
        if (!user.login) {
            return c.html(renderError('Failed to get user info'), 400);
        }
        
        // Check if user is pro
        const proUser = await getProUser(String(user.id));
        const isPro = proUser?.status === 'active';
        
        // Create user cookie value (login, avatar, and pro status for display)
        const userInfo = JSON.stringify({ 
            login: user.login, 
            avatar_url: user.avatar_url,
            isPro
        });
        
        // Build cookies and redirect - use raw Response for Lambda Function URLs
        const cookies = [
            makeCookie('gh_token', token, 60 * 60 * 24 * 30),
            makeCookie('gh_user', encodeURIComponent(userInfo), 60 * 60 * 24 * 30),
        ];
        if (isPro) {
            cookies.push(makeCookie('gc_pro', '1', 60 * 60 * 24 * 365));
        }
        
        return redirectWithCookies('/', cookies);
    } catch (error) {
        return c.html(renderError('Authentication failed'), 500);
    }
};

// Logout - clear cookies (but keep gc_pro for re-auth)
export const logout = (c: Context) => {
    return redirectWithCookies('/', [
        makeCookie('gh_token', '', 0),
        makeCookie('gh_user', '', 0),
    ]);
};

const errorPageCss = `
.error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}
.error-box {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-danger);
    border-radius: 6px;
    padding: 24px 32px;
    text-align: center;
}
.error-box h1 { color: var(--color-danger); margin: 0 0 12px; font-size: 20px; }
.error-box p { margin: 0 0 16px; color: var(--color-text-secondary); }
`;

function renderError(message: string): string {
    return renderPage('Error', `
        <div class="error-container">
            <div class="error-box">
                <h1>Authentication Error</h1>
                <p>${message}</p>
                <a href="/">← Back to DASE Hub</a>
            </div>
        </div>
    `, errorPageCss);
}
