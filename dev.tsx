import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';

import { logView } from '#src/utils/db';
import { setEvent } from '#src/utils/event';

// Migrated pages (JSX components)
import { AboutPage } from '#src/pages/about';
import { updatesHandler, updatesDocHandler } from '#src/pages/updates';
import { reportsHandler, reportsDocHandler } from '#src/pages/reports';
import { feedbackHandler, submitFeatureHandler, voteHandler, deleteFeatureHandler } from '#src/pages/feedback';
import { signupHandler, signupSubmitHandler } from '#src/pages/signup';
import { homeHandler } from '#src/pages/home';
import { keyResultsHandler } from '#src/pages/key-results';
import { submitStatsHandler, submitStatsUpdateHandler, submitStatsAddHandler } from '#src/pages/submit-stats';
import {
    adminHandler, adminLoginHandler, adminLogoutHandler, adminSyncHandler,
    adminMoveHandler, adminObjectiveAddHandler, adminObjectiveDeleteHandler, adminMetricDeleteHandler,
    adminObjectiveToggleHandler, adminMetricToggleHandler,
} from '#src/pages/admin';

// Route handlers
import { github, githubPro, callback, logout } from '#src/routes/public/auth';
import { robots, sitemap, security, humans } from '#src/routes/public/static';
import { repo } from '#src/routes/public/repo';
import { commits } from '#src/routes/public/commits';
import { issues, issuesList } from '#src/routes/public/issues';
import config from '#src/utils/config';

// Create app for local dev (no Lambda bindings needed)
const app = new Hono();

// Middleware to set legacy event (mocked for local dev) and log views
app.use('*', async (c, next) => {
    const mockEvent = {
        headers: Object.fromEntries(
            [...c.req.raw.headers.entries()].map(([k, v]) => [k, v])
        ),
        requestContext: {}
    };
    setEvent(mockEvent as any);
    logView(mockEvent.headers || {}, c.req.path);
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
app.get('/updates', reportsHandler);
app.get('/updates/:slug', updatesDocHandler);
app.get('/reports', (c) => c.redirect('/updates', 302));
app.get('/reports/:slug', reportsDocHandler);
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
    if (owner && owner !== ALLOWED_OWNER) return c.text('Not Found', 404);
    await next();
});
app.use('/:owner', async (c, next) => {
    const owner = c.req.param('owner')?.toLowerCase();
    if (owner && owner !== ALLOWED_OWNER) return c.text('Not Found', 404);
    await next();
});

app.get('/:owner', repo);
app.get('/:owner/:repo', repo);
app.get('/:owner/:repo/tree/:branch/*', repo);
app.get('/:owner/:repo/blob/:branch/*', repo);

// Issues routes
app.get('/:owner/:repo/issues', issuesList);
app.get('/:owner/:repo/issues/:number', issues);

// Commits routes
app.get('/:owner/:repo/commits', commits);
app.get('/:owner/:repo/commit/:sha', commits);

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`🚀 Server running at http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});
