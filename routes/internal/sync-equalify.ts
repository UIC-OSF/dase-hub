/**
 * Equalify stats sync.
 *
 * Pulls aggregate counts from Equalify's public GraphQL API (Hasura, anonymous
 * role), scan volume from CloudWatch, and usage totals from Equalify's public
 * stats endpoint, then writes them into any Key Results metric tagged
 * { source: 'equalify', sourceKey }.
 *
 * Invocation:
 *   - EventBridge schedule / Lambda Test event: { "sync": "equalify" }
 *   - POST /admin/sync (Sync Now button in the admin area)
 *
 * Sources and the sourceKeys they provide (plain-language definitions live in
 * SOURCE_DEFINITIONS and are written onto each metric on every sync):
 *
 *   GraphQL aggregates — required; the sync fails without them
 *     scanned_urls, scanned_html, scanned_pdfs, scanned_pdfs_red, audits_total, active_users
 *   GraphQL url + scan listings — optional
 *     sites_monitored_30d, sites_total, uic_urls,
 *     rescan_delta_pct (+ rescan_audits, rescan_issues_first, rescan_issues_latest)
 *   CloudWatch scan metrics — optional; needs cloudwatch:GetMetricStatistics on the Lambda role
 *     pages_scanned_30d, pages_per_day_30d, html_scanned_30d, pdfs_scanned_30d
 *   GET /public/getPublicStats — optional
 *     registered_users, new_users_30d, active_users_30d, units_served_30d
 *
 * An optional source that fails is reported as a warning on the integration
 * card and its metrics keep their last synced value. A "<key>_fill" stat sets
 * the metric's progress meter (0–100) where a natural percentage exists.
 */
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { getObjectives, putObjective, getIntegration, putIntegration, SOURCE_DEFINITIONS } from '#src/utils/keyResults';

const GRAPHQL_URL = process.env.EQUALIFY_GRAPHQL_URL || 'https://graphql.equalifyapp.com/v1/graphql';
const PUBLIC_STATS_URL = process.env.EQUALIFY_PUBLIC_STATS_URL || 'https://api.equalifyapp.com/public/getPublicStats';
const CLOUDWATCH_NAMESPACE = process.env.EQUALIFY_CLOUDWATCH_NAMESPACE || 'equalifyuic';
const CLOUDWATCH_REGION = process.env.EQUALIFY_CLOUDWATCH_REGION || 'us-east-2';
const UIC_DOMAIN = 'uic.edu';
const WINDOW_DAYS = 30;
const PAGE_SIZE = 10000;

type Stats = Record<string, number>;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const pct = (part: number, whole: number) => (whole > 0 ? clamp(Math.round((part / whole) * 100), 0, 100) : 0);
const windowStart = () => new Date(Date.now() - WINDOW_DAYS * 86400e3);

async function graphql(query: string, variables?: Record<string, unknown>): Promise<any> {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'DASE-Hub' },
        body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new Error(`Equalify GraphQL HTTP ${response.status}`);
    const json = await response.json();
    if (json.errors?.length) throw new Error(`Equalify GraphQL: ${json.errors[0].message}`);
    return json.data;
}

/** Page through a list field (query must take $limit and $offset) until a short page comes back. */
async function graphqlAll<T>(query: string, field: string, variables: Record<string, unknown> = {}): Promise<T[]> {
    const rows: T[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const data = await graphql(query, { ...variables, limit: PAGE_SIZE, offset });
        const page: T[] = data[field] || [];
        for (const row of page) rows.push(row);
        if (page.length < PAGE_SIZE) return rows;
    }
}

// ── Required: aggregate counts ────────────────────────────────────────────────

async function fetchCoreStats(): Promise<Stats> {
    // Aggregate counts don't support filtering urls by the audit relationship for
    // the anonymous role, so RED is a two-step query: audit ids first, then _in.
    const counts = await graphql(`{
        urls: urls_aggregate { aggregate { count } }
        pdfs: urls_aggregate(where: { type: { _eq: "pdf" } }) { aggregate { count } }
        html: urls_aggregate(where: { type: { _eq: "html" } }) { aggregate { count } }
        audits: audits_aggregate { aggregate { count } }
        activeUsers: audits_aggregate { aggregate { count(columns: user_id, distinct: true) } }
        redAudits: audits(where: { name: { _ilike: "%RED%" } }, limit: 500) { id }
    }`);

    const redIds: string[] = (counts.redAudits || []).map((a: { id: string }) => a.id);
    let redPdfs = 0;
    if (redIds.length > 0) {
        const red = await graphql(
            `query ($ids: [uuid!]) {
                redPdfs: urls_aggregate(where: { type: { _eq: "pdf" }, audit_id: { _in: $ids } }) { aggregate { count } }
            }`,
            { ids: redIds },
        );
        redPdfs = red.redPdfs.aggregate.count;
    }

    return {
        scanned_urls: counts.urls.aggregate.count,
        scanned_pdfs: counts.pdfs.aggregate.count,
        scanned_html: counts.html.aggregate.count,
        scanned_pdfs_red: redPdfs,
        audits_total: counts.audits.aggregate.count,
        active_users: counts.activeUsers.aggregate.count,
    };
}

// ── Optional: sites under monitoring ─────────────────────────────────────────

function hostOf(url: string): string {
    try {
        return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`).hostname.toLowerCase();
    } catch {
        return '';
    }
}
const isUicHost = (host: string) => host === UIC_DOMAIN || host.endsWith(`.${UIC_DOMAIN}`);

/** Distinct uic.edu hostnames across all tracked URLs, and those in audits scanned within the window. */
async function fetchSiteStats(): Promise<Stats> {
    const [urls, recentScans] = await Promise.all([
        graphqlAll<{ url: string; audit_id: string }>(
            `query ($limit: Int!, $offset: Int!) {
                urls(limit: $limit, offset: $offset, order_by: { id: asc }) { url audit_id }
            }`, 'urls'),
        graphqlAll<{ audit_id: string }>(
            `query ($limit: Int!, $offset: Int!, $since: timestamptz!) {
                scans(where: { created_at: { _gte: $since }, status: { _eq: "complete" } }, limit: $limit, offset: $offset, order_by: { id: asc }) { audit_id }
            }`, 'scans', { since: windowStart().toISOString() }),
    ]);

    const recentAudits = new Set(recentScans.map(s => s.audit_id));
    const allSites = new Set<string>();
    const recentSites = new Set<string>();
    let uicUrls = 0;
    for (const { url, audit_id } of urls) {
        const host = hostOf(url);
        if (!isUicHost(host)) continue;
        uicUrls++;
        allSites.add(host);
        if (recentAudits.has(audit_id)) recentSites.add(host);
    }
    return {
        sites_monitored_30d: recentSites.size,
        sites_monitored_30d_fill: pct(recentSites.size, allSites.size),
        sites_total: allSites.size,
        uic_urls: uicUrls,
    };
}

// ── Optional: detected issues on rescanned sites ─────────────────────────────

interface ScanRow { id: string; audit_id: string; created_at: string; blocker_count: number | null }

function samePageSet(a?: string[], b?: string[]): boolean {
    if (!a || !b || a.length === 0 || a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((id, i) => id === sortedB[i]);
}

/**
 * For every audit with 2+ completed scans, compare its first and latest scan.
 * Only audits whose latest scan processed the identical set of pages count, so
 * the change reflects fixes (or regressions), not pages added or removed.
 */
async function fetchRescanStats(): Promise<Stats> {
    const scans = await graphqlAll<ScanRow>(
        `query ($limit: Int!, $offset: Int!) {
            scans(where: { status: { _eq: "complete" } }, limit: $limit, offset: $offset, order_by: { id: asc }) { id audit_id created_at blocker_count }
        }`, 'scans');

    const byAudit = new Map<string, ScanRow[]>();
    for (const scan of scans) {
        if (scan.blocker_count == null) continue;
        const list = byAudit.get(scan.audit_id) || [];
        list.push(scan);
        byAudit.set(scan.audit_id, list);
    }
    const pairs: Array<[ScanRow, ScanRow]> = [];
    for (const list of byAudit.values()) {
        if (list.length < 2) continue;
        list.sort((a, b) => a.created_at.localeCompare(b.created_at));
        pairs.push([list[0], list[list.length - 1]]);
    }

    // Page-id lists are large, so only fetch them for the scans being compared.
    const ids = pairs.flatMap(([first, latest]) => [first.id, latest.id]);
    const pages = new Map<string, string[]>();
    for (let i = 0; i < ids.length; i += 100) {
        const data = await graphql(
            `query ($ids: [uuid!]!) { scans(where: { id: { _in: $ids } }) { id processed_pages } }`,
            { ids: ids.slice(i, i + 100) },
        );
        for (const scan of data.scans) pages.set(scan.id, Array.isArray(scan.processed_pages) ? scan.processed_pages : []);
    }

    let audits = 0, first = 0, latest = 0;
    for (const [a, b] of pairs) {
        if (!samePageSet(pages.get(a.id), pages.get(b.id))) continue;
        audits++;
        first += a.blocker_count!;
        latest += b.blocker_count!;
    }
    return {
        rescan_audits: audits,
        rescan_issues_first: first,
        rescan_issues_latest: latest,
        rescan_delta_pct: first ? Math.round(((latest - first) / first) * 100) : 0,
        // Meter shows the improvement (fewer issues = fuller bar)
        rescan_delta_pct_fill: first ? clamp(Math.round(((first - latest) / first) * 100), 0, 100) : 0,
    };
}

// ── Optional: scan volume from CloudWatch ────────────────────────────────────

/** Pages and PDFs the scanners started in the window (same metric Equalify's Account > Statistics uses). */
async function fetchScanVolume(): Promise<Stats> {
    const cloudwatch = new CloudWatchClient({ region: CLOUDWATCH_REGION });
    const end = new Date();
    const start = windowStart();
    const sum = async (service: string): Promise<number> => {
        const res = await cloudwatch.send(new GetMetricStatisticsCommand({
            Namespace: CLOUDWATCH_NAMESPACE,
            MetricName: 'scansStarted',
            Dimensions: [{ Name: 'service', Value: service }],
            StartTime: start,
            EndTime: end,
            Period: 86400, // daily buckets, summed below
            Statistics: ['Sum'],
        }));
        // CloudWatch returns one datapoint per bucket, sometimes with a partial trailing bucket first — add them all up
        return (res.Datapoints || []).reduce((total, point) => total + (point.Sum ?? 0), 0);
    };
    const [html, pdf] = await Promise.all([sum('aws-lambda-scan-html'), sum('aws-lambda-scan-pdf')]);
    return {
        html_scanned_30d: Math.round(html),
        pdfs_scanned_30d: Math.round(pdf),
        pages_scanned_30d: Math.round(html + pdf),
        pages_per_day_30d: Math.round((html + pdf) / WINDOW_DAYS),
    };
}

// ── Optional: usage totals from Equalify's public stats endpoint ─────────────

async function fetchUsageStats(core: Stats): Promise<Stats> {
    // Cache-buster: the API sits behind CloudFront
    const response = await fetch(`${PUBLIC_STATS_URL}?t=${Date.now()}`, { headers: { 'User-Agent': 'DASE-Hub' } });
    if (!response.ok) throw new Error(`Equalify public stats HTTP ${response.status}`);
    const json = await response.json();
    if (!json || typeof json.totalUsers !== 'number') {
        throw new Error('Equalify public stats: unexpected response (is /public/getPublicStats deployed?)');
    }
    const registered: number = json.totalUsers;
    return {
        registered_users: registered,
        new_users_30d: json.newUsers30d ?? 0,
        active_users_30d: json.activeUsers30d ?? 0,
        active_users_30d_fill: pct(json.activeUsers30d ?? 0, registered),
        units_served_30d: json.unitsServed30d ?? 0,
        active_users_fill: pct(core.active_users, registered),
    };
}

// ── Sync ──────────────────────────────────────────────────────────────────────

/** Every stat DASE Hub knows how to consume, plus a warning per optional source that failed. */
export async function fetchEqualifyStats(): Promise<{ stats: Stats; warnings: string[] }> {
    const core = await fetchCoreStats();
    const optional: Array<[label: string, work: Promise<Stats>]> = [
        ['sites', fetchSiteStats()],
        ['rescans', fetchRescanStats()],
        ['CloudWatch scan volume', fetchScanVolume()],
        ['usage totals', fetchUsageStats(core)],
    ];
    const stats: Stats = { ...core };
    const warnings: string[] = [];
    const results = await Promise.allSettled(optional.map(([, work]) => work));
    results.forEach((result, i) => {
        if (result.status === 'fulfilled') Object.assign(stats, result.value);
        else warnings.push(`${optional[i][0]}: ${result.reason?.message || result.reason}`);
    });
    return { stats, warnings };
}

/** Percent stats get an explicit sign ("−25"); everything else is a plain count. */
function formatStat(key: string, value: number): string {
    const rounded = Math.round(value);
    if (key.endsWith('_pct')) {
        const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
        return `${sign}${Math.abs(rounded).toLocaleString('en-US')}`;
    }
    return rounded.toLocaleString('en-US');
}

export interface SyncResult {
    ok: boolean;
    stats?: Stats;
    warnings?: string[];
    updatedMetrics?: string[];
    error?: string;
    syncedAt: string;
}

/** Run the sync: fetch stats, update tagged metrics, record integration state. */
export async function syncEqualifyStats(): Promise<SyncResult> {
    const syncedAt = new Date().toISOString();
    const prior = await getIntegration('equalify');

    try {
        const { stats, warnings } = await fetchEqualifyStats();

        const objectives = await getObjectives();
        const updated: string[] = [];
        for (const objective of objectives) {
            let changed = false;
            for (const metric of objective.metrics) {
                if (metric.source !== 'equalify' || !metric.sourceKey) continue;
                const definition = SOURCE_DEFINITIONS[`equalify:${metric.sourceKey}`];
                if (definition && metric.definition !== definition) {
                    metric.definition = definition;
                    changed = true;
                }
                const value = stats[metric.sourceKey];
                if (value === undefined) continue;
                metric.metric = (metric.metricTemplate || 'Count: {value}').replace('{value}', formatStat(metric.sourceKey, value));
                const fill = stats[`${metric.sourceKey}_fill`];
                if (fill !== undefined) metric.currentValue = clamp(Math.round(fill), 0, 100);
                metric.updatedAt = syncedAt;
                metric.updatedBy = 'equalify-sync';
                updated.push(`${objective.id}/${metric.id}`);
                changed = true;
            }
            if (changed) await putObjective(objective);
        }

        // Meter fills are an implementation detail; keep the admin chips to real stats
        const lastStats = Object.fromEntries(Object.entries(stats).filter(([key]) => !key.endsWith('_fill')));

        await putIntegration({
            id: 'equalify',
            name: 'Equalify',
            endpoint: GRAPHQL_URL,
            lastSyncAt: syncedAt,
            lastStatus: 'ok',
            lastError: undefined,
            lastWarning: warnings.length ? warnings.join('; ') : undefined,
            lastStats,
            syncCount: (prior?.syncCount || 0) + 1,
        });

        return { ok: true, stats: lastStats, warnings, updatedMetrics: updated, syncedAt };
    } catch (err: any) {
        await putIntegration({
            id: 'equalify',
            name: 'Equalify',
            endpoint: GRAPHQL_URL,
            lastSyncAt: prior?.lastSyncAt,
            lastStatus: 'error',
            lastError: err.message,
            lastWarning: prior?.lastWarning,
            lastStats: prior?.lastStats,
            syncCount: prior?.syncCount || 0,
        });
        return { ok: false, error: err.message, syncedAt };
    }
}
