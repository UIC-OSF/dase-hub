import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import type { LambdaEvent, LambdaContext } from 'hono/aws-lambda';
import { setCookie } from 'hono/cookie';

import { logView } from '#src/utils/db';
import { setEvent } from '#src/utils/event';

// Migrated pages (JSX components)
import { AboutPage } from '#src/pages/about';
import { feedbackHandler, submitFeatureHandler, voteHandler, deleteFeatureHandler } from '#src/pages/feedback';
import { signupHandler, signupSubmitHandler } from '#src/pages/signup';
import { homeHandler } from '#src/pages/home';
import { keyResultsHandler } from '#src/pages/key-results';
import { submitStatsHandler, submitStatsUpdateHandler, submitStatsAddHandler, submitStatsEditFormHandler, submitStatsNewFormHandler } from '#src/pages/submit-stats';
import {
    adminHandler, adminLoginHandler, adminLogoutHandler, adminSyncHandler,
    adminMoveHandler, adminObjectiveAddHandler, adminObjectiveDeleteHandler, adminMetricDeleteHandler,
    adminObjectiveToggleHandler, adminMetricToggleHandler,
} from '#src/pages/admin';
import { syncEqualifyStats } from '#src/routes/internal/sync-equalify';
import { syncReflowStats } from '#src/routes/internal/sync-reflow';

// Route handlers (all native Hono now)
import { github, githubPro, callback, logout } from '#src/routes/public/auth';
import { robots, sitemap, security, humans } from '#src/routes/public/static';
import { repo } from '#src/routes/public/repo';
import { commits } from '#src/routes/public/commits';
import { issues, issuesList } from '#src/routes/public/issues';
import { generateReport } from '#src/routes/internal/generate-report';
import config from '#src/utils/config';

// Create app
const app = new Hono<{ Bindings: { event: LambdaEvent; context: LambdaContext } }>();

// Middleware to set legacy event (for auth utils) and log views
app.use('*', async (c, next) => {
    const rawEvent = c.env?.event || {} as LambdaEvent;
    setEvent(rawEvent); // Still needed for getCurrentUser/getGitHubToken which read cookies from event
    logView(rawEvent.headers || {}, c.req.path);
    await next();
});

// ============ THEME TOGGLE ============
app.post('/theme', async (c) => {
    const body = await c.req.parseBody();
    const theme = body.theme as string;
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
        setCookie(c, 'theme', theme, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'Lax',
        });
    }
    const referer = c.req.header('referer') || '/';
    return c.redirect(referer, 303);
});

// ============ STATIC FILES ============
app.get('/robots.txt', robots);
app.get('/sitemap.xml', sitemap);
app.get('/humans.txt', humans);
app.get('/.well-known/security.txt', security);

// ============ AUTH ROUTES ============
app.get('/github', github);
app.get('/github-pro', githubPro);
app.get('/callback', callback);
app.get('/auth/github/callback', callback);
app.get('/logout', logout);

// ============ MIGRATED ROUTES (Hono native JSX) ============
app.get('/', homeHandler);
app.get('/about', (c) => c.html(<AboutPage />));
// Updates content is Equalify news (from equalify-docs) — link out rather than host it here.
// Restore local pages via pages/updates.tsx + pages/reports.tsx when a DASE docs repo exists.
app.get('/updates', (c) => c.redirect(`${config.equalifyHubUrl}/updates`, 302));
app.get('/updates/:slug', (c) => c.redirect(`${config.equalifyHubUrl}/updates/${c.req.param('slug')}`, 302));
app.get('/reports', (c) => c.redirect(`${config.equalifyHubUrl}/updates`, 302));
app.get('/reports/:slug', (c) => c.redirect(`${config.equalifyHubUrl}/reports/${c.req.param('slug')}`, 302));
app.get('/roadmap', (c) => c.redirect('/about#roadmap', 302));
// Equalify products live on the Equalify Hub — link out rather than host them here
app.get('/dashboard', (c) => c.redirect(`${config.equalifyHubUrl}/dashboard`, 302));
app.get('/dashboard/*', (c) => c.redirect(`${config.equalifyHubUrl}/dashboard`, 302));
app.get('/reflow', (c) => c.redirect(`${config.equalifyHubUrl}/reflow`, 302));
app.get('/reflow/*', (c) => c.redirect(`${config.equalifyHubUrl}/reflow`, 302));
app.get('/signup', signupHandler);
app.post('/signup/submit', signupSubmitHandler);
// Key Results dashboard + manual stats + admin
app.get('/key-results', keyResultsHandler);
app.get('/submit-stats', submitStatsHandler);
app.get('/submit-stats/edit', submitStatsEditFormHandler);
app.get('/submit-stats/new', submitStatsNewFormHandler);
app.post('/submit-stats', submitStatsUpdateHandler);
app.post('/submit-stats/add', submitStatsAddHandler);
app.get('/admin', adminHandler);
app.post('/admin/login', adminLoginHandler);
app.get('/admin/logout', adminLogoutHandler);
app.post('/admin/sync', adminSyncHandler);
app.post('/admin/move', adminMoveHandler);
app.post('/admin/objective/add', adminObjectiveAddHandler);
app.post('/admin/objective/delete', adminObjectiveDeleteHandler);
app.post('/admin/objective/toggle', adminObjectiveToggleHandler);
app.post('/admin/metric/delete', adminMetricDeleteHandler);
app.post('/admin/metric/toggle', adminMetricToggleHandler);
app.get('/feedback', feedbackHandler);
app.post('/feedback/submit', submitFeatureHandler);
app.post('/feedback/vote', voteHandler);
app.post('/feedback/delete', deleteFeatureHandler);
app.get('/feature-request', feedbackHandler);
app.post('/feature-request/submit', submitFeatureHandler);
app.post('/feature-request/vote', voteHandler);
app.post('/feature-request/delete', deleteFeatureHandler);

// ============ DYNAMIC ROUTES ============
// Only allow repos/issues/commits for our own org
const ALLOWED_OWNER = config.githubOrg.toLowerCase();

app.use('/:owner{[^/]+}/*', async (c, next) => {
    const owner = c.req.param('owner')?.toLowerCase();
    if (owner && owner !== ALLOWED_OWNER) {
        return c.text('Not Found', 404);
    }
    await next();
});
app.use('/:owner', async (c, next) => {
    const owner = c.req.param('owner')?.toLowerCase();
    if (owner && owner !== ALLOWED_OWNER) {
        return c.text('Not Found', 404);
    }
    await next();
});

// Repo routes: /:owner, /:owner/:repo, /:owner/:repo/tree/:branch/...
app.get('/:owner', repo);
app.get('/:owner/:repo', repo);
app.get('/:owner/:repo/tree/:branch/*', repo);
app.get('/:owner/:repo/blob/:branch/*', repo);

// Issues routes
app.get('/:owner/:repo/issues', issuesList);
app.get('/:owner/:repo/issues/:number', issues);

// Commits routes: /:owner/:repo/commits, /:owner/:repo/commit/:sha
app.get('/:owner/:repo/commits', commits);
app.get('/:owner/:repo/commit/:sha', commits);

// Export handler for Lambda
// Wraps Hono handler to intercept non-HTTP events (Lambda Test, EventBridge)
const honoHandler = handle(app);

export const handler = async (event: any, context: any) => {
    // Internal: sync Key Results stats from all integrations via EventBridge schedule or Lambda Test
    // Event shape: { "sync": "equalify" } (value kept for back-compat; any sync event runs everything)
    if (event.sync) {
        const [equalify, reflow] = await Promise.all([syncEqualifyStats(), syncReflowStats()]);
        const ok = equalify.ok && reflow.ok;
        return { statusCode: ok ? 200 : 500, body: JSON.stringify({ equalify, reflow }, null, 2) };
    }

    // Internal: generate report via Lambda Test or EventBridge
    // Event shape: { "report": { "issueNumber": 587, "month": "2026-03", "polish": true, "push": false } }
    if (event.report) {
        try {
            const result = await generateReport(event.report);
            return { statusCode: 200, body: JSON.stringify(result, null, 2) };
        } catch (err: any) {
            return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
        }
    }

    // Normal HTTP request — pass to Hono
    return honoHandler(event, context);
};

