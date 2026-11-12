// Shared base CSS for legacy template literal pages
// Uses CSS variables for light/dark mode support

import { getThemeClass } from './theme';
import { getCurrentUser } from './auth';
import config from './config';

export const baseCss = `
:root {
    --color-bg: #ffffff;
    --color-bg-secondary: #f6f8fa;
    --color-bg-tertiary: #eaeef2;
    --color-border: #d0d7de;
    --color-text: #1f2328;
    --color-text-secondary: #656d76;
    --color-text-muted: #8c959f;
    --color-link: #0969da;
    --color-success: #1a7f37;
    --color-danger: #cf222e;
    --color-warning: #bf8700;
}
@media (prefers-color-scheme: dark) {
    :root:not(.light) {
        --color-bg: #0d1117;
        --color-bg-secondary: #161b22;
        --color-bg-tertiary: #21262d;
        --color-border: #30363d;
        --color-text: #e6edf3;
        --color-text-secondary: #8b949e;
        --color-text-muted: #6e7681;
        --color-link: #58a6ff;
        --color-success: #3fb950;
        --color-danger: #f85149;
        --color-warning: #f78166;
    }
}
:root.dark {
    --color-bg: #0d1117;
    --color-bg-secondary: #161b22;
    --color-bg-tertiary: #21262d;
    --color-border: #30363d;
    --color-text: #e6edf3;
    --color-text-secondary: #8b949e;
    --color-text-muted: #6e7681;
    --color-link: #58a6ff;
    --color-success: #3fb950;
    --color-danger: #f85149;
    --color-warning: #f78166;
}
* { box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background: var(--color-bg);
    color: var(--color-text);
}
a { color: var(--color-link); text-decoration: none; }
a:hover { text-decoration: underline; }
nav {
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}
nav .logo { 
    font-size: 20px; 
    font-weight: 600; 
    color: var(--color-text); 
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
}
nav a { color: var(--color-text-secondary); text-decoration: none; font-size: 14px; }
nav a:hover { color: var(--color-text); text-decoration: none; }
nav form { display: none; }
@media (min-width: 600px) {
    nav { gap: 24px; padding: 12px 20px; }
    nav form { display: block; flex: 1; max-width: 400px; }
}
nav input {
    width: 100%;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 6px 12px;
    color: var(--color-text);
    font-size: 14px;
}
nav input::placeholder { color: var(--color-text-muted); }
nav input:focus { outline: none; border-color: var(--color-link); }
.container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 24px 20px;
}
footer {
    text-align: center;
    padding: 24px 16px;
    color: var(--color-text-secondary);
    font-size: 12px;
    border-top: 1px solid var(--color-border);
}
`;

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderNav(): string {
    const user = getCurrentUser();
    
    const authSection = user 
        ? `<div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
               <a href="/${user.login}" style="display:flex;align-items:center;gap:8px;">
                   <img src="${user.avatar_url}" alt="${escapeHtml(user.login)}" style="width:20px;height:20px;border-radius:50%;">
                   ${escapeHtml(user.login)}
               </a>
               <a href="/logout">Sign out</a>
           </div>`
        : '';
    
    return `<nav>
        <a href="/" class="logo" style="display:flex;align-items:center;gap:8px;">
            <img src="${config.orgLogo}" alt="${config.githubOrg}" style="width:24px;height:24px;border-radius:4px;">
            ${config.siteName}
        </a>
        ${authSection}
    </nav>`;
}

export function renderFooter(): string {
    return `<footer style="background:#f8f9fa;border-top:1px solid #d1d5db;padding:24px;text-align:center;font-size:13px;color:#6b7280;">
        <p style="margin:0;">1200 West Harrison St. · Chicago, IL 60607 · (312) 996-7000</p>
    </footer>`;
}

export function renderPage(title: string, content: string, extraCss: string = ''): string {
    const themeClass = getThemeClass();
    
    return `<!DOCTYPE html>
<html lang="en"${themeClass ? ` class="${themeClass}"` : ''}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} – ${config.siteName}</title>
    <link rel="icon" href="${config.favicon}">
    <style>${baseCss}${extraCss}</style>
</head>
<body>
    ${renderNav()}
    ${content}
    ${renderFooter()}
</body>
</html>`;
}
