import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { isAdminAuthed, isAdminConfigured } from '#src/utils/adminAuth';
import { getOrSeedObjectives, updateMetric, addMetric, logSubmission, Objective } from '#src/utils/keyResults';

const styles = `
.ss-container { max-width: 860px; margin: 0 auto; padding: 40px 24px 64px; }
.ss-container h1 { font-size: 28px; font-weight: 700; color: #001e62; margin: 0 0 8px; }
.ss-subtitle { color: #4b5563; margin: 0 0 28px; font-size: 15px; }
.ss-alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
.ss-alert-error { background: #fef2f2; border: 1px solid #C8102E; color: #9a0c23; }
.ss-alert-success { background: #f0fdf4; border: 1px solid #059669; color: #065f46; }

/* Passcode gate */
.ss-gate {
    max-width: 420px;
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 24px;
}
.ss-gate h2 { margin: 0 0 8px; font-size: 17px; color: #1f2937; }
.ss-gate p { margin: 0 0 16px; font-size: 14px; color: #6b7280; }

/* Objective sections */
.ss-objective {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 20px;
}
.ss-objective h2 {
    font-size: 17px;
    color: #001e62;
    margin: 0 0 2px;
}
.ss-objective .ss-dates { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
.ss-metric-form {
    display: grid;
    grid-template-columns: 1fr 170px 90px auto;
    gap: 10px;
    align-items: end;
    padding: 12px 0;
    border-top: 1px solid #f1f5f9;
}
@media (max-width: 720px) { .ss-metric-form { grid-template-columns: 1fr 1fr; } }
.ss-field label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.ss-field input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    color: #1f2937;
    background: #ffffff;
    box-sizing: border-box;
}
.ss-field input:focus { outline: none; border-color: #C8102E; }
.ss-field input[readonly] { background: #f8f9fa; color: #4b5563; }
.ss-synced-note { font-size: 12px; color: #6b7280; padding: 10px 0 2px; border-top: 1px solid #f1f5f9; }
.ss-btn {
    background: #C8102E; color: #fff; border: none;
    padding: 9px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
    white-space: nowrap;
}
.ss-btn:hover { background: #9a0c23; }
.ss-btn-secondary { background: #001e62; }
.ss-btn-secondary:hover { background: #001845; }
.ss-name-bar {
    background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 8px;
    padding: 14px 18px; margin-bottom: 24px;
    display: flex; gap: 12px; align-items: end; flex-wrap: wrap;
}
.ss-name-bar .ss-field { flex: 1; min-width: 220px; }
.ss-add-row summary { cursor: pointer; font-size: 13px; color: #C8102E; font-weight: 600; padding-top: 10px; }
`;

const PasscodeGate: FC<{ returnTo: string; error?: string; configured: boolean }> = ({ returnTo, error, configured }) => (
    <div class="ss-gate">
        <h2>Team access</h2>
        {configured ? (
            <>
                <p>Enter the DASE team passcode to submit stats. Ask Chris if you need it.</p>
                {error && <div class="ss-alert ss-alert-error">{error}</div>}
                <form method="post" action="/admin/login">
                    <input type="hidden" name="return_to" value={returnTo} />
                    <div class="ss-field" style="margin-bottom:12px;">
                        <label>Passcode</label>
                        <input type="password" name="passcode" required autocomplete="current-password" />
                    </div>
                    <button type="submit" class="ss-btn">Continue</button>
                </form>
            </>
        ) : (
            <p>Manual stats entry isn't configured yet (no team passcode has been set).</p>
        )}
    </div>
);

export const SubmitStatsPage: FC<{ objectives: Objective[]; authed: boolean; configured: boolean; saved?: string; error?: string }> = ({
    objectives, authed, configured, saved, error,
}) => {
    const user = getCurrentUser();

    return (
        <Layout title="Submit Stats" styles={styles} user={user}>
            <div class="ss-container">
                <h1>Submit Stats</h1>
                <p class="ss-subtitle">
                    Update the numbers on the <a href="/key-results" style="color:#C8102E;">Key Results</a> dashboard.
                    Equalify-synced metrics update automatically and can't be edited here.
                </p>

                {!authed ? (
                    <PasscodeGate returnTo="/submit-stats" error={error} configured={configured} />
                ) : (
                    <>
                        {saved && <div class="ss-alert ss-alert-success">Saved — "{saved}" has been updated on the dashboard.</div>}
                        {error && <div class="ss-alert ss-alert-error">{error}</div>}

                        <div class="ss-name-bar">
                            <div class="ss-field">
                                <label>Your name (recorded with each update)</label>
                                <input type="text" id="submitter-name" placeholder="e.g. Helen" maxlength={60}
                                    oninput="document.querySelectorAll('input[name=submitted_by]').forEach(i=>i.value=this.value)" />
                            </div>
                        </div>

                        {objectives.map(objective => (
                            <section class="ss-objective">
                                <h2>{objective.title}</h2>
                                <p class="ss-dates">{objective.subtitle}</p>

                                {objective.metrics.map(metric => metric.source === 'equalify' ? (
                                    <div class="ss-synced-note">
                                        🔄 <strong>{metric.label}</strong> — synced automatically from Equalify ({metric.metric})
                                    </div>
                                ) : (
                                    <form method="post" action="/submit-stats" class="ss-metric-form">
                                        <input type="hidden" name="objective_id" value={objective.id} />
                                        <input type="hidden" name="metric_id" value={metric.id} />
                                        <input type="hidden" name="submitted_by" value="" />
                                        <div class="ss-field">
                                            <label>Metric</label>
                                            <input type="text" value={metric.label} readonly tabindex={-1} />
                                        </div>
                                        <div class="ss-field">
                                            <label>Value (shown in badge)</label>
                                            <input type="text" name="metric_value" value={metric.metric} required maxlength={60} />
                                        </div>
                                        <div class="ss-field">
                                            <label>Progress %</label>
                                            <input type="number" name="current_value" value={String(metric.currentValue)} min={0} max={100} required />
                                        </div>
                                        <button type="submit" class="ss-btn">Update</button>
                                    </form>
                                ))}

                                <details class="ss-add-row">
                                    <summary>+ Add a metric to this objective</summary>
                                    <form method="post" action="/submit-stats/add" class="ss-metric-form">
                                        <input type="hidden" name="objective_id" value={objective.id} />
                                        <input type="hidden" name="submitted_by" value="" />
                                        <div class="ss-field">
                                            <label>Metric name</label>
                                            <input type="text" name="metric_label" placeholder="e.g. Workshops Held" required maxlength={80} />
                                        </div>
                                        <div class="ss-field">
                                            <label>Value (shown in badge)</label>
                                            <input type="text" name="metric_value" placeholder="e.g. Count: 12" required maxlength={60} />
                                        </div>
                                        <div class="ss-field">
                                            <label>Progress %</label>
                                            <input type="number" name="current_value" value="50" min={0} max={100} required />
                                        </div>
                                        <button type="submit" class="ss-btn ss-btn-secondary">Add</button>
                                    </form>
                                </details>
                            </section>
                        ))}
                    </>
                )}
            </div>
        </Layout>
    );
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function submitStatsHandler(c: Context) {
    const authed = isAdminAuthed(c);
    const objectives = authed ? await getOrSeedObjectives() : [];
    return c.html(
        <SubmitStatsPage
            objectives={objectives}
            authed={authed}
            configured={isAdminConfigured()}
            saved={c.req.query('saved')}
            error={c.req.query('error')}
        />,
    );
}

export async function submitStatsUpdateHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/submit-stats', 303);
    const body = await c.req.parseBody();
    const objectiveId = String(body.objective_id || '');
    const metricId = String(body.metric_id || '');
    const metricValue = String(body.metric_value || '').trim();
    const currentValue = Math.max(0, Math.min(100, parseInt(String(body.current_value), 10) || 0));
    const submittedBy = String(body.submitted_by || '').trim() || 'Anonymous';

    if (!objectiveId || !metricId || !metricValue) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('All fields are required'), 303);
    }

    const now = new Date().toISOString();
    const updated = await updateMetric(objectiveId, metricId, {
        metric: metricValue,
        currentValue,
        updatedAt: now,
        updatedBy: submittedBy,
    });
    if (!updated) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('Metric not found'), 303);
    }

    await logSubmission({
        at: now, by: submittedBy, objectiveId,
        metricLabel: updated.label,
        change: `${updated.label} → "${metricValue}" (${currentValue}%)`,
    });
    return c.redirect('/submit-stats?saved=' + encodeURIComponent(updated.label), 303);
}

export async function submitStatsAddHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/submit-stats', 303);
    const body = await c.req.parseBody();
    const objectiveId = String(body.objective_id || '');
    const label = String(body.metric_label || '').trim();
    const metricValue = String(body.metric_value || '').trim();
    const currentValue = Math.max(0, Math.min(100, parseInt(String(body.current_value), 10) || 0));
    const submittedBy = String(body.submitted_by || '').trim() || 'Anonymous';

    if (!objectiveId || !label || !metricValue) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('All fields are required'), 303);
    }

    const now = new Date().toISOString();
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `metric-${Date.now()}`;
    const ok = await addMetric(objectiveId, {
        id, label, metric: metricValue, currentValue,
        status: 'med', updatedAt: now, updatedBy: submittedBy,
    });
    if (!ok) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('Objective not found'), 303);
    }

    await logSubmission({
        at: now, by: submittedBy, objectiveId,
        metricLabel: label,
        change: `Added "${label}" = "${metricValue}" (${currentValue}%)`,
    });
    return c.redirect('/submit-stats?saved=' + encodeURIComponent(label), 303);
}
