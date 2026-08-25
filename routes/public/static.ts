// Static files: robots.txt, sitemap.xml, security.txt, humans.txt
import type { Context } from 'hono';
import config from '#src/utils/config';

// Public site URL (CloudFront / Lambda Function URL). Empty until configured.
const base = config.siteUrl.replace(/\/$/, '');

export const robots = (c: Context) => {
    const lines = [
        'User-agent: *',
        'Allow: /',
        '',
        `# ${config.siteName} — central dashboard for the UIC Digital Accessibility team`,
    ];
    if (base) {
        lines.push(`# ${base}`, '', `Sitemap: ${base}/sitemap.xml`);
    }
    return c.text(lines.join('\n'));
};

export const sitemap = (c: Context) => {
    const paths = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/key-results', priority: '0.9', changefreq: 'daily' },
        { path: '/about', priority: '0.9', changefreq: 'monthly' },
        { path: '/feedback', priority: '0.6', changefreq: 'weekly' },
        { path: '/signup', priority: '0.6', changefreq: 'monthly' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url>
    <loc>${base}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return c.body(xml, 200, { 'Content-Type': 'application/xml' });
};

export const security = (c: Context) => {
    const lines = [
        `Contact: https://github.com/${config.githubOrg}`,
        'Preferred-Languages: en',
    ];
    if (base) lines.push(`Canonical: ${base}/.well-known/security.txt`);
    return c.text(lines.join('\n'));
};

export const humans = (c: Context) => {
    return c.text(`/* TEAM */
Maintained by: UIC Digital Accessibility team
GitHub: @${config.githubOrg}

/* SITE */
Name: ${config.siteName}
Built with: TypeScript, Node.js, AWS Lambda
Standards: HTML5, CSS3
Philosophy: A single source of truth for the team's projects.

/* THANKS */
GitHub - for the API
UIC - for the support`);
};
