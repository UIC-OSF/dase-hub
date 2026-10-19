import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { isAdminAuthed, isAdminConfigured, tryAdminLogin, adminLogout } from '#src/utils/adminAuth';
import {
    getOrSeedObjectives, getIntegration, moveObjective, putObjective, deleteObjective, deleteMetric,
    setObjectiveHidden, updateMetric, getRecentSubmissions, renderSubtitle, Objective, IntegrationState, Submission,
} from '#src/utils/keyResults';
import { syncEqualifyStats } from '#src/routes/internal/sync-equalify';
import { syncReflowStats } from '#src/routes/internal/sync-reflow';

const styles = `
.ad-container { max-width: 960px; margin: 0 auto; padding: 40px 24px 64px; }
.ad-container h1 { font-size: 28px; font-weight: 700; color: #001e62; margin: 0 0 8px; }
.ad-subtitle { color: #4b5563; margin: 0 0 28px; font-size: 15px; }
.ad-alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
.ad-alert-error { background: #fef2f2; border: 1px solid #C8102E; color: #9a0c23; }
.ad-alert-success { background: #f0fdf4; border: 1px solid #059669; color: #065f46; }

.ad-gate { max-width: 420px; background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 8px; padding: 24px; }
.ad-gate h2 { margin: 0 0 8px; font-size: 17px; color: #1f2937; }
.ad-gate p { margin: 0 0 16px; font-size: 14px; color: #6b7280; }

h2.ad-section { font-size: 20px; font-weight: 700; color: #001e62; margin: 36px 0 14px; }
h2.ad-section:first-of-type { margin-top: 0; }

/* Integration card */
.ad-integration {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px;
    display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;
}
.ad-int-main { flex: 1; min-width: 260px; }
.ad-int-name { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
.ad-status-dot { width: 10px; height: 10px; border-radius: 50%; background: #2e7d32; }
.ad-status-dot.error { background: #C8102E; }
.ad-status-dot.never { background: #9ca3af; }
.ad-int-meta { font-size: 13px; color: #6b7280; line-height: 1.7; }
.ad-int-meta code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
.ad-stats-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
.ad-stat-chip { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #4b5563; }
.ad-stat-chip strong { display: block; font-size: 16px; color: #001e62; }

.ad-btn {
    background: #C8102E; color: #fff; border: none;
    padding: 9px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block;
}
.ad-btn:hover { background: #9a0c23; text-decoration: none; color: #fff; }
.ad-btn-ghost { background: transparent; color: #4b5563; border: 1px solid #d1d5db; }
.ad-btn-ghost:hover { background: #f8f9fa; color: #1f2937; }
.ad-btn-sm { padding: 5px 10px; font-size: 12px; }

/* Objectives manager */
.ad-obj {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 14px 18px; margin-bottom: 10px;
    display: flex; align-items: center; gap: 14px;
}
.ad-obj-order { display: flex; flex-direction: column; gap: 2px; }
.ad-obj-order button { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; font-size: 11px; padding: 2px 8px; color: #4b5563; }
.ad-obj-order button:hover { background: #e2e8f0; color: #1f2937; }
.ad-obj-main { flex: 1; }
.ad-obj-main h3 { margin: 0; font-size: 15px; color: #1f2937; }
.ad-obj-main p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
.ad-metric-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.ad-metric-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 2px 4px 2px 10px; font-size: 12px; color: #4b5563;
}
.ad-metric-pill form { display: inline; }
.ad-metric-pill button { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 13px; padding: 0 5px; }
.ad-metric-pill button:hover { color: #C8102E; }
.ad-pill-synced { border-color: #bfdbfe; background: #eff6ff; }

/* Visibility toggles */
.ad-vis { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #4b5563; cursor: pointer; user-select: none; }
.ad-vis input { accent-color: #C8102E; width: 14px; height: 14px; cursor: pointer; margin: 0; }
.ad-obj.ad-is-hidden, .ad-metric-pill.ad-is-hidden { opacity: 0.5; }
.ad-hidden-tag { font-size: 11px; font-weight: 600; color: #92400e; background: #fef3c7; border-radius: 4px; padding: 1px 6px; margin-left: 6px; }

/* Add objective + submissions */
.ad-add-form { display: flex; gap: 10px; align-items: end; flex-wrap: wrap; background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 8px; padding: 14px 18px; }
.ad-field label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.ad-field input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1f2937; background: #fff; }
.ad-field input:focus { outline: none; border-color: #C8102E; }
.ad-log { font-size: 13px; color: #4b5563; }
.ad-log li { padding: 6px 0; border-bottom: 1px solid #f1f5f9; list-style: none; }
.ad-log ul { padding: 0; margin: 0; }
.ad-log .ad-log-time { color: #6b7280; font-size: 12px; }
.ad-topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
`;

const timeAgo = (iso?: string): string => {
    if (!iso) return 'never';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const STAT_LABELS: Record<string, string> = {
    scanned_urls: 'Scanned URLs',
    scanned_html: 'HTML pages',
    scanned_pdfs: 'PDFs (all)',
    scanned_pdfs_red: 'PDFs (RED)',
    audits_total: 'Audits',
    active_users: 'Audit owners',
    registered_users: 'Registered users',
    new_users_30d: 'New users (30d)',
    active_users_30d: 'Active users (30d)',
    units_served_30d: 'Departments (30d)',
    sites_monitored_30d: 'UIC sites (30d)',
    sites_total: 'UIC sites (ever)',
    uic_urls: 'uic.edu URLs',
    pages_scanned_30d: 'Pages scanned (30d)',
    pages_per_day_30d: 'Pages / day (30d)',
    html_scanned_30d: 'HTML scanned (30d)',
    pdfs_scanned_30d: 'PDFs scanned (30d)',
    rescan_delta_pct: 'Rescan change %',
    rescan_audits: 'Rescanned audits',
    rescan_issues_first: 'Rescan issues (first)',
    rescan_issues_latest: 'Rescan issues (latest)',
    documents_processed: 'Documents converted',
    pages_processed: 'Pages converted',
};

const INTEGRATION_BLURBS: Record<string, string> = {
    equalify: 'Live accessibility-scan stats via GraphQL',
    reflow: 'Live PDF-conversion stats from the Iris service',
};

const IntegrationCard: FC<{ id: string; fallbackName: string; fallbackEndpoint: string; state: IntegrationState | null }> = ({ id, fallbackName, fallbackEndpoint, state }) => {
    const dotClass = !state?.lastSyncAt ? 'never' : state.lastStatus === 'error' ? 'error' : '';
    return (
        <div class="ad-integration" style="margin-bottom:14px;">
            <div class="ad-int-main">
                <div class="ad-int-name">
                    <span class={`ad-status-dot ${dotClass}`}></span>
                    {state?.name || fallbackName}
                </div>
                <div class="ad-int-meta">
                    {INTEGRATION_BLURBS[id] || 'External stats source'} · <code>{state?.endpoint || fallbackEndpoint}</code><br />
                    Last sync: <strong>{timeAgo(state?.lastSyncAt)}</strong>
                    {state?.syncCount ? ` · ${state.syncCount} total syncs` : ''}
                    {' · '}Schedule: every 6 hours
                    {state?.lastStatus === 'error' && state.lastError && (
                        <><br /><span style="color:#C8102E;">Last error: {state.lastError}</span></>
                    )}
                    {state?.lastWarning && (
                        <><br /><span style="color:#92400e;">Partial sync — {state.lastWarning}</span></>
                    )}
                </div>
                {state?.lastStats && (
                    <div class="ad-stats-row">
                        {Object.entries(state.lastStats).map(([key, value]) => (
                            <span class="ad-stat-chip">
                                <strong>{value.toLocaleString('en-US')}</strong>
                                {STAT_LABELS[key] || key}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <form method="post" action="/admin/sync">
                <input type="hidden" name="integration" value={id} />
                <button type="submit" class="ad-btn">Sync Now</button>
            </form>
        </div>
    );
};

export const AdminPage: FC<{
    objectives: Objective[];
    equalify: IntegrationState | null;
    reflow: IntegrationState | null;
    submissions: Submission[];
    authed: boolean;
    configured: boolean;
    notice?: string;
    error?: string;
}> = ({ objectives, equalify, reflow, submissions, authed, configured, notice, error }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Admin" styles={styles} user={user}>
            <div class="ad-container">
                <div class="ad-topbar">
                    <div>
                        <h1>DASE Hub Admin</h1>
                        <p class="ad-subtitle">Integrations, dashboard layout, and manual submissions.</p>
                    </div>
                    {authed && <a href="/admin/logout" class="ad-btn ad-btn-ghost ad-btn-sm">Sign out</a>}
                </div>

                {!authed ? (
                    <div class="ad-gate">
                        <h2>Admin access</h2>
                        {configured ? (
                            <>
                                <p>Enter the DASE team passcode.</p>
                                {error && <div class="ad-alert ad-alert-error">{error}</div>}
                                <form method="post" action="/admin/login">
                                    <input type="hidden" name="return_to" value="/admin" />
                                    <div class="ad-field" style="margin-bottom:12px;">
                                        <label>Passcode</label>
                                        <input type="password" name="passcode" required style="width:100%;box-sizing:border-box;" />
                                    </div>
                                    <button type="submit" class="ad-btn">Continue</button>
                                </form>
                            </>
                        ) : (
                            <p>Admin isn't configured yet (no ADMIN_KEY set on the deployment).</p>
                        )}
                    </div>
                ) : (
                    <>
                        {notice && <div class="ad-alert ad-alert-success">{notice}</div>}
                        {error && <div class="ad-alert ad-alert-error">{error}</div>}

                        <h2 class="ad-section">Integrations</h2>
                        <IntegrationCard id="equalify" fallbackName="Equalify" fallbackEndpoint="https://graphql.equalifyapp.com/v1/graphql" state={equalify} />
                        <IntegrationCard id="reflow" fallbackName="Equalify Iris" fallbackEndpoint="https://iris.equalify.uic.edu/v1/stats" state={reflow} />

                        <h2 class="ad-section">Dashboard layout</h2>
                        {objectives.map((objective, i) => (
                            <div class={`ad-obj ${objective.hidden ? 'ad-is-hidden' : ''}`}>
                                <div class="ad-obj-order">
                                    <form method="post" action="/admin/move">
                                        <input type="hidden" name="id" value={objective.id} />
                                        <input type="hidden" name="dir" value="up" />
                                        <button type="submit" disabled={i === 0} aria-label={`Move ${objective.title} up`}>▲</button>
                                    </form>
                                    <form method="post" action="/admin/move">
                                        <input type="hidden" name="id" value={objective.id} />
                                        <input type="hidden" name="dir" value="down" />
                                        <button type="submit" disabled={i === objectives.length - 1} aria-label={`Move ${objective.title} down`}>▼</button>
                                    </form>
                                </div>
                                <div class="ad-obj-main">
                                    <h3>
                                        {objective.title}{objective.upcoming ? ' (Upcoming)' : ''}
                                        {objective.hidden && <span class="ad-hidden-tag">Hidden</span>}
                                    </h3>
                                    <p>{renderSubtitle(objective.subtitle)} · {objective.metrics.length} metric{objective.metrics.length === 1 ? '' : 's'}</p>
                                    <div class="ad-metric-pills">
                                        {objective.metrics.map(metric => (
                                            <span class={`ad-metric-pill ${metric.source ? 'ad-pill-synced' : ''} ${metric.hidden ? 'ad-is-hidden' : ''}`}>
                                                <form method="post" action="/admin/metric/toggle">
                                                    <input type="hidden" name="objective_id" value={objective.id} />
                                                    <input type="hidden" name="metric_id" value={metric.id} />
                                                    <input type="hidden" name="set" value={metric.hidden ? 'visible' : 'hidden'} />
                                                    <label class="ad-vis">
                                                        <input type="checkbox" checked={!metric.hidden} onchange="this.form.submit()"
                                                            aria-label={`Show ${metric.label} on the public dashboard`} />
                                                    </label>
                                                </form>
                                                {metric.source ? '🔄 ' : ''}{metric.label}
                                                <form method="post" action="/admin/metric/delete" onsubmit={`return confirm('Remove metric \\'${metric.label.replace(/'/g, '')}\\' from the dashboard?')`}>
                                                    <input type="hidden" name="objective_id" value={objective.id} />
                                                    <input type="hidden" name="metric_id" value={metric.id} />
                                                    <button type="submit" aria-label={`Delete metric ${metric.label}`}>×</button>
                                                </form>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                                    <form method="post" action="/admin/objective/toggle">
                                        <input type="hidden" name="id" value={objective.id} />
                                        <input type="hidden" name="set" value={objective.hidden ? 'visible' : 'hidden'} />
                                        <label class="ad-vis">
                                            <input type="checkbox" checked={!objective.hidden} onchange="this.form.submit()"
                                                aria-label={`Show ${objective.title} on the public dashboard`} />
                                            Shown
                                        </label>
                                    </form>
                                    <form method="post" action="/admin/objective/delete" onsubmit={`return confirm('Delete objective \\'${objective.title.replace(/'/g, '')}\\' and all its metrics?')`}>
                                        <input type="hidden" name="id" value={objective.id} />
                                        <button type="submit" class="ad-btn ad-btn-ghost ad-btn-sm">Delete</button>
                                    </form>
                                </div>
                            </div>
                        ))}

                        <form method="post" action="/admin/objective/add" class="ad-add-form" style="margin-top:14px;">
                            <div class="ad-field" style="flex:2;min-width:220px;">
                                <label>New objective title</label>
                                <input type="text" name="title" placeholder="e.g. Champion AI Innovation" required maxlength={90} style="width:100%;box-sizing:border-box;" />
                            </div>
                            <div class="ad-field" style="flex:1;min-width:160px;">
                                <label>Date range</label>
                                <input type="text" name="subtitle" placeholder="e.g. Feb 2026 - June 2026" maxlength={50} style="width:100%;box-sizing:border-box;" />
                            </div>
                            <button type="submit" class="ad-btn">Add Objective</button>
                        </form>

                        <h2 class="ad-section">Recent manual submissions</h2>
                        <div class="ad-log">
                            {submissions.length > 0 ? (
                                <ul>
                                    {submissions.map(s => (
                                        <li>
                                            <strong>{s.by}</strong>: {s.change}{' '}
                                            <span class="ad-log-time">· {timeAgo(s.at)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style="color:#6b7280;">No manual submissions yet. Values entered on <a href="/submit-stats" style="color:#C8102E;">Submit Stats</a> will appear here.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

// ── Handlers ──────────────────────────────────────────────────────────────────

async function renderAdmin(c: Context, notice?: string, error?: string) {
    const authed = isAdminAuthed(c);
    const [objectives, equalify, reflow, submissions] = authed
        ? await Promise.all([getOrSeedObjectives(), getIntegration('equalify'), getIntegration('reflow'), getRecentSubmissions()])
        : [[], null, null, []] as const;
    return c.html(
        <AdminPage
            objectives={objectives as Objective[]}
            equalify={equalify}
            reflow={reflow}
            submissions={submissions as Submission[]}
            authed={authed}
            configured={isAdminConfigured()}
            notice={notice ?? c.req.query('notice')}
            error={error ?? c.req.query('error')}
        />,
    );
}

export async function adminHandler(c: Context) {
    return renderAdmin(c);
}

export async function adminLoginHandler(c: Context) {
    const body = await c.req.parseBody();
    const passcode = String(body.passcode || '');
    const returnTo = String(body.return_to || '/admin');
    const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/admin';
    if (tryAdminLogin(c, passcode)) {
        return c.redirect(safeReturn, 303);
    }
    return c.redirect(`${safeReturn}?error=${encodeURIComponent('Incorrect passcode')}`, 303);
}

export async function adminLogoutHandler(c: Context) {
    adminLogout(c);
    return c.redirect('/admin', 303);
}

export async function adminSyncHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const which = String(body.integration || '');
    const name = which === 'reflow' ? 'Iris' : 'Equalify';
    const result = which === 'reflow' ? await syncReflowStats() : await syncEqualifyStats();
    if (result.ok) {
        const n = result.updatedMetrics?.length || 0;
        const warnings = (result as { warnings?: string[] }).warnings || [];
        const partial = warnings.length ? ` (partial: ${warnings.join('; ')})` : '';
        return c.redirect(`/admin?notice=${encodeURIComponent(`Synced from ${name} — ${n} metric${n === 1 ? '' : 's'} updated${partial}`)}`, 303);
    }
    return c.redirect(`/admin?error=${encodeURIComponent(`${name} sync failed: ${result.error}`)}`, 303);
}

export async function adminMoveHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const id = String(body.id || '');
    const dir = String(body.dir || '') as 'up' | 'down';
    if (id && (dir === 'up' || dir === 'down')) await moveObjective(id, dir);
    return c.redirect('/admin', 303);
}

export async function adminObjectiveAddHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const title = String(body.title || '').trim();
    const subtitle = String(body.subtitle || '').trim();
    if (!title) return c.redirect(`/admin?error=${encodeURIComponent('Title is required')}`, 303);
    const objectives = await getOrSeedObjectives();
    const maxOrder = objectives.reduce((max, o) => Math.max(max, o.order), 0);
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `objective-${Date.now()}`;
    if (objectives.some(o => o.id === id)) {
        return c.redirect(`/admin?error=${encodeURIComponent('An objective with a similar title already exists')}`, 303);
    }
    await putObjective({ id, title, subtitle, order: maxOrder + 10, metrics: [] });
    return c.redirect(`/admin?notice=${encodeURIComponent(`Added "${title}" — add metrics via Submit Stats`)}`, 303);
}

export async function adminObjectiveDeleteHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const id = String(body.id || '');
    if (id) await deleteObjective(id);
    return c.redirect('/admin', 303);
}

export async function adminObjectiveToggleHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const id = String(body.id || '');
    const hidden = String(body.set || '') === 'hidden';
    if (id) await setObjectiveHidden(id, hidden);
    return c.redirect('/admin', 303);
}

export async function adminMetricToggleHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const objectiveId = String(body.objective_id || '');
    const metricId = String(body.metric_id || '');
    const hidden = String(body.set || '') === 'hidden';
    if (objectiveId && metricId) await updateMetric(objectiveId, metricId, { hidden });
    return c.redirect('/admin', 303);
}

export async function adminMetricDeleteHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/admin', 303);
    const body = await c.req.parseBody();
    const objectiveId = String(body.objective_id || '');
    const metricId = String(body.metric_id || '');
    if (objectiveId && metricId) await deleteMetric(objectiveId, metricId);
    return c.redirect('/admin', 303);
}
