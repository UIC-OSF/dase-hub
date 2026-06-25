import { getCurrentUser } from '#src/utils/auth';
import config from '#src/utils/config';

// Site configuration - uses environment variables from config
export const site = {
    name: config.siteName,
    tagline: `Central dashboard for the UIC Digital Accessibility team`,
    favicon: config.favicon,
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="20" height="20" style="margin-top:1px;"><circle cx="100" cy="100" r="65" fill="none" stroke="#e6edf3" stroke-width="28"/><line x1="100" y1="125" x2="100" y2="90" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="90" x2="65" y2="50" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="90" x2="120" y2="112" stroke="#e6edf3" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="125" r="10" fill="#e6edf3"/><circle cx="100" cy="90" r="10" fill="#e6edf3"/><circle cx="120" cy="112" r="10" fill="#e6edf3"/></svg>`,
};

// Navigation links - customize for your project
export const navLinks: { href: string; label: string }[] = [];

// Base CSS styles - dark theme
export const baseStyles = `
* { box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background: #0d1117;
    color: #e6edf3;
}
a { color: #58a6ff; text-decoration: none; }
a:hover { text-decoration: underline; }
nav {
    background: #161b22;
    border-bottom: 1px solid #30363d;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}
nav .logo { font-size: 18px; font-weight: 600; color: #e6edf3; text-decoration: none; }
nav a { color: #8b949e; text-decoration: none; font-size: 14px; white-space: nowrap; }
nav a:hover { color: #e6edf3; text-decoration: none; }
footer {
    text-align: center;
    padding: 24px 16px;
    color: #8b949e;
    font-size: 12px;
    border-top: 1px solid #30363d;
}
@media (min-width: 600px) {
    nav { gap: 24px; }
}
`;

// Generate auth section based on current user
export function getAuthSection(user = getCurrentUser()) {
    if (!user) {
        return `<a href="/github" style="margin-left:auto;">Sign in</a>`;
    }
    
    return `<div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
        <a href="/${user.login}" style="display:flex;align-items:center;gap:8px;">
            <img src="${user.avatar_url}" alt="${user.login}" style="width:20px;height:20px;border-radius:50%;">
            ${user.login}
        </a>
        <a href="/logout">Sign out</a>
    </div>`;
}

// Generate navigation bar
export function nav(user = getCurrentUser()) {
    const links = navLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('\n        ');
    return `<nav>
        <a href="/" class="logo" style="display:flex;align-items:center;gap:8px;">
            <img src="${config.orgLogo}" alt="${config.githubOrg}" style="width:24px;height:24px;border-radius:4px;">
            ${site.name}
        </a>
        ${links}
        ${getAuthSection(user)}
    </nav>`;
}

// Generate footer
export function footer(links: { href: string; label: string }[] = [
    { href: '/about', label: 'About' },
    { href: `https://github.com/${config.githubOrg}`, label: 'GitHub' },
    { href: config.equalifyHubUrl, label: 'Equalify' }
]) {
    const linkHtml = links.map(l => `<a href="${l.href}">${l.label}</a>`).join(' · ');
    return `<footer>
        ${linkHtml}
    </footer>`;
}

// Generate full HTML document
export function html(options: {
    title: string;
    body: string;
    styles?: string;
    user?: ReturnType<typeof getCurrentUser>;
}) {
    const user = options.user ?? getCurrentUser();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title} – ${site.name}</title>
    <link rel="icon" href="${site.favicon}">
    <style>
        ${baseStyles}
        ${options.styles || ''}
    </style>
</head>
<body>
    ${nav(user)}
    ${options.body}
    ${footer()}
</body>
</html>`;
}

// Common response helper
export function htmlResponse(options: {
    title: string;
    body: string;
    styles?: string;
    user?: ReturnType<typeof getCurrentUser>;
    statusCode?: number;
}) {
    return {
        statusCode: options.statusCode || 200,
        headers: { 'Content-Type': 'text/html' },
        body: html(options)
    };
}

// Escape HTML to prevent XSS
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
