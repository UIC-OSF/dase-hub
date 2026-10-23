import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { isAdminAuthed, isAdminConfigured } from '#src/utils/adminAuth';
import { getOrSeedObjectives, getObjective, updateMetric, addMetric, logSubmission, renderSubtitle, parseDisplayValue, targetProgress, Objective, Metric } from '#src/utils/keyResults';

const NAME_COOKIE = 'dase_name';

function formatDisplayValue(prefix: string, value: number, suffix: string): string {
    return `${prefix}${value.toLocaleString('en-US')}${suffix}`;
}

const styles = `
.ss-container { max-width: 760px; margin: 0 auto; padding: 40px 24px 64px; }
.ss-container h1 { font-size: 28px; font-weight: 700; color: #001e62; margin: 0 0 8px; }
.ss-subtitle { color: #4b5563; margin: 0 0 28px; font-size: 15px; line-height: 1.6; }
.ss-alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
.ss-alert-error { background: #fef2f2; border: 1px solid #C8102E; color: #9a0c23; }
.ss-alert-success { background: #f0fdf4; border: 1px solid #059669; color: #065f46; }
.ss-alert-success .ss-change { font-weight: 600; }

/* Passcode gate */
.ss-gate { max-width: 420px; background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 8px; padding: 24px; }
.ss-gate h2 { margin: 0 0 8px; font-size: 17px; color: #1f2937; }
.ss-gate p { margin: 0 0 16px; font-size: 14px; color: #6b7280; }

/* Picker */
.ss-group { margin-bottom: 28px; }
.ss-group h2 { font-size: 16px; font-weight: 700; color: #001e62; margin: 0 0 2px; }
.ss-group .ss-group-dates { font-size: 12px; color: #6b7280; margin: 0 0 10px; }
.ss-rows { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #ffffff; }
.ss-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; border-bottom: 1px solid #f1f5f9;
}
.ss-row:last-child { border-bottom: none; }
.ss-row-main { flex: 1; min-width: 0; }
.ss-row-label { font-size: 14px; font-weight: 600; color: #1f2937; }
.ss-row-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
.ss-row-value {
    flex-shrink: 0; font-size: 13px; font-weight: 700; color: #1f2937;
    background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 11px; white-space: nowrap;
}
.ss-row-synced { font-size: 12px; color: #6b7280; flex-shrink: 0; }
.ss-link { color: #C8102E; font-weight: 600; text-decoration: none; }
.ss-link:hover { text-decoration: underline; }
.ss-more { margin-top: 8px; }
.ss-more summary { font-size: 13px; color: #C8102E; font-weight: 600; cursor: pointer; width: fit-content; }
.ss-note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #1e3a8a; margin-bottom: 20px; line-height: 1.5; }
.ss-hidden-tag { font-size: 11px; font-weight: 600; color: #92400e; background: #fef3c7; border-radius: 4px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; }
.ss-btn {
    background: #C8102E; color: #fff; border: none; text-decoration: none; display: inline-block;
    padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.ss-btn:hover { background: #9a0c23; color: #fff; text-decoration: none; }
.ss-add-link { display: inline-block; margin-top: 8px; font-size: 13px; color: #C8102E; font-weight: 600; text-decoration: none; }
.ss-add-link:hover { text-decoration: underline; }

/* Single-metric form */
.ss-back { display: inline-flex; align-items: center; gap: 6px; color: #4b5563; font-size: 14px; text-decoration: none; margin-bottom: 20px; }
.ss-back:hover { color: #C8102E; }
.ss-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; }
.ss-card h1 { font-size: 22px; margin: 0 0 4px; }
.ss-card .ss-context { font-size: 13px; color: #6b7280; margin: 0 0 20px; }
.ss-current {
    background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 14px 18px; margin-bottom: 24px; font-size: 14px; color: #4b5563;
}
.ss-current strong { font-size: 20px; color: #001e62; display: block; margin-top: 2px; }
.ss-field { margin-bottom: 18px; }
.ss-field > label { display: block; font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
.ss-field .ss-hint { font-size: 12px; color: #6b7280; font-weight: 400; margin-top: 4px; }
.ss-field input[type="text"], .ss-field input[type="number"] {
    padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 15px; font-family: inherit; color: #1f2937; background: #ffffff; box-sizing: border-box;
}
.ss-field input:focus, .ss-field textarea:focus { outline: none; border-color: #C8102E; }
.ss-field textarea {
    padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 14px; font-family: inherit; color: #1f2937; background: #ffffff; box-sizing: border-box; resize: vertical;
}
.ss-number-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ss-number-wrap .ss-affix { font-size: 15px; color: #4b5563; font-weight: 600; }
.ss-number-wrap input { width: 160px; font-size: 18px; font-weight: 700; }
.ss-save { font-size: 15px; padding: 11px 24px; }
`;

const timeAgo = (iso?: string): string => {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return 'today';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return 'today';
    const days = Math.floor(hours / 24);
    if (days < 31) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PasscodeGate: FC<{ configured: boolean; error?: string }> = ({ configured, error }) => (
    <div class="ss-gate">
        <h2>Team access</h2>
        {configured ? (
            <>
                <p>Enter the DASE team passcode to submit stats. Ask Chris if you need it.</p>
                {error && <div class="ss-alert ss-alert-error">{error}</div>}
                <form method="post" action="/admin/login">
                    <input type="hidden" name="return_to" value="/submit-stats" />
                    <div class="ss-field" style="margin-bottom:12px;">
                        <label>Passcode</label>
                        <input type="password" name="passcode" required autocomplete="current-password" style="width:100%;" />
                    </div>
                    <button type="submit" class="ss-btn">Continue</button>
                </form>
            </>
        ) : (
            <p>Manual stats entry isn't configured yet (no team passcode has been set).</p>
        )}
    </div>
);

// ── Page 1: metric picker ─────────────────────────────────────────────────────

const PickerPage: FC<{ objectives: Objective[]; saved?: string; error?: string }> = ({ objectives, saved, error }) => {
    const user = getCurrentUser();
    return (
        <Layout title="Submit Stats" styles={styles} user={user}>
            <div class="ss-container">
                <h1>Submit Stats</h1>
                <p class="ss-subtitle">
                    Pick the number you want to update — each one has its own short form.
                    Changes appear on the <a href="/key-results" style="color:#C8102E;">Key Results</a> dashboard right away.
                </p>

                {saved && <div class="ss-alert ss-alert-success">✓ Saved: <span class="ss-change">{saved}</span></div>}
                {error && <div class="ss-alert ss-alert-error">{error}</div>}

                {objectives.map(objective => (
                    <section class="ss-group">
                        <h2>{objective.title}{objective.hidden && <span class="ss-hidden-tag">Hidden from dashboard</span>}</h2>
                        <p class="ss-group-dates">{renderSubtitle(objective.subtitle)}</p>
                        <div class="ss-rows">
                            {objective.metrics.map(metric => (
                                <div class="ss-row">
                                    <div class="ss-row-main">
                                        <div class="ss-row-label">
                                            {metric.label}
                                            {metric.hidden && !objective.hidden && <span class="ss-hidden-tag">Hidden</span>}
                                        </div>
                                        {metric.definition && <div class="ss-row-meta">{metric.definition}</div>}
                                        {metric.target ? <div class="ss-row-meta">Goal: {metric.target.toLocaleString('en-US')} · {targetProgress(metric) ?? 0}% there</div> : null}
                                        {metric.updatedAt && !metric.source && (
                                            <div class="ss-row-meta">
                                                Last updated {timeAgo(metric.updatedAt)}{metric.updatedBy ? ` by ${metric.updatedBy}` : ''}
                                            </div>
                                        )}
                                    </div>
                                    <span class="ss-row-value">{metric.metric}</span>
                                    {metric.source ? (
                                        <span class="ss-row-synced">🔄 Auto-synced · <a href={`/submit-stats/edit?objective=${objective.id}&metric=${metric.id}`} class="ss-link">Rename / goal</a></span>
                                    ) : (
                                        <a href={`/submit-stats/edit?objective=${objective.id}&metric=${metric.id}`} class="ss-btn">Update</a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <a href={`/submit-stats/new?objective=${objective.id}`} class="ss-add-link">+ Add a metric to this objective</a>
                    </section>
                ))}
            </div>
        </Layout>
    );
};

// ── Page 2: single-metric form ────────────────────────────────────────────────

const EditMetricPage: FC<{ objective: Objective; metric: Metric; defaultName: string }> = ({ objective, metric, defaultName }) => {
    const user = getCurrentUser();
    const synced = Boolean(metric.source);
    const parsed = parseDisplayValue(metric.metric);
    const progress = targetProgress(metric);
    const sourceName = metric.source === 'reflow' ? 'Iris' : 'Equalify';
    return (
        <Layout title={`${synced ? 'Rename' : 'Update'} ${metric.label}`} styles={styles} user={user}>
            <div class="ss-container">
                <a href="/submit-stats" class="ss-back">← All metrics</a>
                <div class="ss-card">
                    <h1>{metric.label}</h1>
                    <p class="ss-context">{objective.title} · {renderSubtitle(objective.subtitle)}</p>

                    <div class="ss-current">
                        Current value on the dashboard
                        <strong>{metric.metric}</strong>
                        {metric.updatedAt && (
                            <span style="font-size:12px;color:#6b7280;">
                                {synced ? 'Synced' : 'Last updated'} {timeAgo(metric.updatedAt)}{!synced && metric.updatedBy ? ` by ${metric.updatedBy}` : ''}
                            </span>
                        )}
                    </div>

                    {synced && (
                        <div class="ss-note">
                            This number is synced automatically from {sourceName}, so the value and its definition update on their own.
                            You can rename it or give it a goal here.
                        </div>
                    )}

                    <form method="post" action="/submit-stats">
                        <input type="hidden" name="objective_id" value={objective.id} />
                        <input type="hidden" name="metric_id" value={metric.id} />

                        <div class="ss-field">
                            <label for="metric_label">Metric name</label>
                            <input type="text" id="metric_label" name="metric_label" value={metric.label} required maxlength={80} style="width:100%;" />
                            <div class="ss-hint">Shown on the dashboard. Change it to rename this KPI.</div>
                        </div>

                        {!synced && (parsed ? (
                            <div class="ss-field">
                                <label for="value_number">New number</label>
                                <div class="ss-number-wrap">
                                    {parsed.prefix && <span class="ss-affix">{parsed.prefix.trim()}</span>}
                                    <input type="number" id="value_number" name="value_number" value={String(parsed.value)}
                                        min={0} step="any" required autofocus />
                                    {parsed.suffix && <span class="ss-affix">{parsed.suffix.trim()}</span>}
                                </div>
                                <div class="ss-hint">Just the number — the label around it stays the same.</div>
                                <details class="ss-more">
                                    <summary>Change the wording around the number</summary>
                                    <div class="ss-number-wrap" style="margin-top:8px;">
                                        <input type="text" name="value_prefix" value={parsed.prefix.trim()} maxlength={30} placeholder="e.g. Total:" style="width:150px;font-size:14px;font-weight:500;" aria-label="Text before the number" />
                                        <span class="ss-affix" style="font-weight:400;color:#6b7280;">number</span>
                                        <input type="text" name="value_suffix" value={parsed.suffix.trim()} maxlength={30} placeholder="e.g. People" style="width:150px;font-size:14px;font-weight:500;" aria-label="Text after the number" />
                                    </div>
                                    <div class="ss-hint">For example "Total:" and "Sessions" shows as "Total: 56 Sessions". Leave as-is to keep the current wording.</div>
                                </details>
                            </div>
                        ) : (
                            <div class="ss-field">
                                <label for="metric_value">New value</label>
                                <input type="text" id="metric_value" name="metric_value" value={metric.metric} required maxlength={60} style="width:100%;" autofocus />
                                <div class="ss-hint">Shown exactly like this in the value badge, e.g. "Count: 12".</div>
                            </div>
                        ))}

                        {!synced && (
                            <div class="ss-field">
                                <label for="definition">What this counts — optional</label>
                                <textarea id="definition" name="definition" maxlength={200} rows={2} style="width:100%;">{metric.definition || ''}</textarea>
                                <div class="ss-hint">One plain-language sentence shown under the metric on the dashboard, e.g. "People trained in department sessions since Jan 2025."</div>
                            </div>
                        )}

                        <div class="ss-field">
                            <label for="target">Goal — optional</label>
                            <div class="ss-number-wrap">
                                <input type="number" id="target" name="target" value={metric.target ? String(metric.target) : ''} min={1} step="any" placeholder="e.g. 1500" />
                                {progress !== null && <span class="ss-affix" style="font-weight:500;color:#2e7d32;">{progress}% there</span>}
                            </div>
                            <div class="ss-hint">When a goal is set, the green bar shows progress toward it automatically and the goal appears on the dashboard. Leave blank for no goal.</div>
                        </div>

                        {!synced && !metric.target && (
                            <div class="ss-field">
                                <label for="current_value">Progress bar fill — optional</label>
                                <input type="number" id="current_value" name="current_value" value={String(metric.currentValue)} min={0} max={100} style="width:120px;" />
                                <div class="ss-hint">0–100. How full the green bar looks when there's no goal. Leave as-is if unsure.</div>
                            </div>
                        )}

                        <div class="ss-field">
                            <label for="submitted_by">Your name</label>
                            <input type="text" id="submitted_by" name="submitted_by" value={defaultName} placeholder="e.g. Helen" required maxlength={60} style="width:240px;" />
                        </div>

                        <button type="submit" class="ss-btn ss-save">{synced ? 'Save Changes' : 'Save Update'}</button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

// ── Page 3: add-metric form ───────────────────────────────────────────────────

const NewMetricPage: FC<{ objective: Objective; defaultName: string }> = ({ objective, defaultName }) => {
    const user = getCurrentUser();
    return (
        <Layout title="Add a Metric" styles={styles} user={user}>
            <div class="ss-container">
                <a href="/submit-stats" class="ss-back">← All metrics</a>
                <div class="ss-card">
                    <h1>Add a metric</h1>
                    <p class="ss-context">{objective.title} · {renderSubtitle(objective.subtitle)}</p>
                    <form method="post" action="/submit-stats/add">
                        <input type="hidden" name="objective_id" value={objective.id} />
                        <div class="ss-field">
                            <label for="metric_label">Metric name</label>
                            <input type="text" id="metric_label" name="metric_label" placeholder="e.g. Annual Workshop Attendees" required maxlength={80} style="width:100%;" autofocus />
                        </div>
                        <div class="ss-field">
                            <label for="metric_value">Value</label>
                            <input type="text" id="metric_value" name="metric_value" placeholder='e.g. "Total: 47 People" or "Count: 12"' required maxlength={60} style="width:100%;" />
                            <div class="ss-hint">Shown in the value badge. Next time, you'll only need to update the number.</div>
                        </div>
                        <div class="ss-field">
                            <label for="target">Goal — optional</label>
                            <input type="number" id="target" name="target" min={1} step="any" placeholder="e.g. 1500" style="width:160px;" />
                            <div class="ss-hint">When set, the green bar shows progress toward it automatically and the goal appears on the dashboard.</div>
                        </div>
                        <div class="ss-field">
                            <label for="definition">What this counts — optional</label>
                            <textarea id="definition" name="definition" maxlength={200} rows={2} style="width:100%;"></textarea>
                            <div class="ss-hint">One plain-language sentence shown under the metric on the dashboard, e.g. "People trained in department sessions since Jan 2025."</div>
                        </div>
                        <div class="ss-field">
                            <label for="current_value">Progress bar fill — optional</label>
                            <input type="number" id="current_value" name="current_value" value="50" min={0} max={100} style="width:120px;" />
                        </div>
                        <div class="ss-field">
                            <label for="submitted_by">Your name</label>
                            <input type="text" id="submitted_by" name="submitted_by" value={defaultName} placeholder="e.g. Helen" required maxlength={60} style="width:240px;" />
                        </div>
                        <button type="submit" class="ss-btn ss-save">Add Metric</button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

// ── Handlers ──────────────────────────────────────────────────────────────────

function gate(c: Context, error?: string) {
    const user = getCurrentUser();
    return c.html(
        <Layout title="Submit Stats" styles={styles} user={user}>
            <div class="ss-container">
                <h1>Submit Stats</h1>
                <p class="ss-subtitle">Update the numbers on the Key Results dashboard.</p>
                <PasscodeGate configured={isAdminConfigured()} error={error} />
            </div>
        </Layout>,
    );
}

function rememberName(c: Context, name: string) {
    setCookie(c, NAME_COOKIE, name, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' });
}

export async function submitStatsHandler(c: Context) {
    if (!isAdminAuthed(c)) return gate(c, c.req.query('error'));
    const objectives = await getOrSeedObjectives();
    return c.html(<PickerPage objectives={objectives} saved={c.req.query('saved')} error={c.req.query('error')} />);
}

export async function submitStatsEditFormHandler(c: Context) {
    if (!isAdminAuthed(c)) return gate(c);
    const objective = await getObjective(c.req.query('objective') || '');
    const metric = objective?.metrics.find(m => m.id === c.req.query('metric'));
    if (!objective || !metric) return c.redirect('/submit-stats?error=' + encodeURIComponent('Metric not found'), 303);
    return c.html(<EditMetricPage objective={objective} metric={metric} defaultName={getCookie(c, NAME_COOKIE) || ''} />);
}

export async function submitStatsNewFormHandler(c: Context) {
    if (!isAdminAuthed(c)) return gate(c);
    const objective = await getObjective(c.req.query('objective') || '');
    if (!objective) return c.redirect('/submit-stats?error=' + encodeURIComponent('Objective not found'), 303);
    return c.html(<NewMetricPage objective={objective} defaultName={getCookie(c, NAME_COOKIE) || ''} />);
}

export async function submitStatsUpdateHandler(c: Context) {
    if (!isAdminAuthed(c)) return c.redirect('/submit-stats', 303);
    const body = await c.req.parseBody();
    const objectiveId = String(body.objective_id || '');
    const metricId = String(body.metric_id || '');
    const submittedBy = String(body.submitted_by || '').trim() || 'Anonymous';
    const fail = (message: string) => c.redirect('/submit-stats?error=' + encodeURIComponent(message), 303);

    const objective = await getObjective(objectiveId);
    const existing = objective?.metrics.find(m => m.id === metricId);
    if (!objective || !existing) return fail('Metric not found');
    const synced = Boolean(existing.source);

    const patch: Partial<Metric> = {};
    const changes: string[] = [];

    // Name and goal apply to every metric, synced or not
    const label = String(body.metric_label ?? existing.label).trim().slice(0, 80) || existing.label;
    if (label !== existing.label) {
        patch.label = label;
        changes.push(`renamed "${existing.label}" → "${label}"`);
    }
    const targetRaw = String(body.target ?? '').trim();
    const target = targetRaw === '' ? undefined : Number(targetRaw);
    if (target !== undefined && (!Number.isFinite(target) || target <= 0)) return fail('The goal must be a number greater than 0');
    if (target !== existing.target) {
        patch.target = target; // undefined clears it
        changes.push(target === undefined ? 'goal removed' : `goal set to ${target.toLocaleString('en-US')}`);
    }

    // Value, definition and fill are hand-entered only for manual metrics;
    // synced ones get theirs from the integration.
    if (!synced) {
        // Preferred path: number-only entry, rebuilt into the stored display format.
        let newDisplay = existing.metric;
        const numberRaw = String(body.value_number ?? '').trim();
        const parsed = parseDisplayValue(existing.metric);
        if (numberRaw !== '' && parsed) {
            const value = Number(numberRaw);
            if (Number.isNaN(value)) return fail('Please enter a valid number');
            // Optional rewording of the text around the number ("Total:" … "Sessions")
            const prefixIn = body.value_prefix !== undefined ? String(body.value_prefix).trim().slice(0, 30) : null;
            const suffixIn = body.value_suffix !== undefined ? String(body.value_suffix).trim().slice(0, 30) : null;
            const prefix = prefixIn === null ? parsed.prefix : (prefixIn ? `${prefixIn} ` : '');
            const suffix = suffixIn === null ? parsed.suffix : (suffixIn ? (/^[%°]/.test(suffixIn) ? suffixIn : ` ${suffixIn}`) : '');
            newDisplay = formatDisplayValue(prefix, value, suffix);
        } else if (body.metric_value !== undefined) {
            newDisplay = String(body.metric_value || '').trim();
            if (!newDisplay) return fail('A value is required');
        }
        if (newDisplay !== existing.metric) {
            patch.metric = newDisplay;
            changes.push(`"${existing.metric}" → "${newDisplay}"`);
        }

        const definition = String(body.definition ?? existing.definition ?? '').trim().slice(0, 200);
        if (definition !== (existing.definition || '')) {
            patch.definition = definition || undefined;
            changes.push('definition updated');
        }

        const currentRaw = String(body.current_value ?? '').trim();
        if (currentRaw !== '') {
            const fill = Math.max(0, Math.min(100, parseInt(currentRaw, 10) || 0));
            if (fill !== existing.currentValue) patch.currentValue = fill;
        }
        if (Object.keys(patch).length) {
            patch.updatedAt = new Date().toISOString();
            patch.updatedBy = submittedBy;
        }
    }

    if (!Object.keys(patch).length) {
        return c.redirect('/submit-stats?saved=' + encodeURIComponent(`${existing.label} — no changes`), 303);
    }

    await updateMetric(objectiveId, metricId, patch);
    if (changes.length) {
        await logSubmission({
            at: new Date().toISOString(), by: submittedBy, objectiveId,
            metricLabel: existing.label,
            change: `${existing.label}: ${changes.join('; ')}`,
        });
    }
    rememberName(c, submittedBy);
    return c.redirect('/submit-stats?saved=' + encodeURIComponent(`${label} — ${changes.join(', ') || 'updated'}`), 303);
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
    const definition = String(body.definition ?? '').trim().slice(0, 200);
    const targetRaw = String(body.target ?? '').trim();
    const target = targetRaw === '' ? undefined : Number(targetRaw);
    if (target !== undefined && (!Number.isFinite(target) || target <= 0)) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('The goal must be a number greater than 0'), 303);
    }
    const ok = await addMetric(objectiveId, {
        id, label, metric: metricValue, currentValue,
        status: 'med', updatedAt: now, updatedBy: submittedBy,
        ...(definition ? { definition } : {}),
        ...(target ? { target } : {}),
    });
    if (!ok) {
        return c.redirect('/submit-stats?error=' + encodeURIComponent('Objective not found'), 303);
    }

    await logSubmission({
        at: now, by: submittedBy, objectiveId,
        metricLabel: label,
        change: `Added "${label}" = "${metricValue}"`,
    });
    rememberName(c, submittedBy);
    return c.redirect('/submit-stats?saved=' + encodeURIComponent(`${label} added (${metricValue})`), 303);
}
