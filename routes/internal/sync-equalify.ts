/**
 * Equalify stats sync.
 *
 * Pulls aggregate counts from Equalify's public GraphQL API (Hasura, anonymous
 * role) and writes them into any Key Results metric tagged
 * { source: 'equalify', sourceKey }.
 *
 * Invocation:
 *   - EventBridge schedule / Lambda Test event: { "sync": "equalify" }
 *   - POST /admin/sync (Sync Now button in the admin area)
 *
 * Available sourceKeys:
 *   scanned_urls       — total rows in urls
 *   scanned_pdfs       — urls where type = 'pdf'
 *   scanned_pdfs_red   — pdf urls belonging to audits named like '%RED%'
 *   scanned_html       — urls where type = 'html'
 *   audits_total       — total audits (properties)
 *   active_users       — distinct users owning at least one audit
 */
import { getObjectives, putObjective, getIntegration, putIntegration } from '#src/utils/keyResults';

const GRAPHQL_URL = process.env.EQUALIFY_GRAPHQL_URL || 'https://graphql.equalifyapp.com/v1/graphql';

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

/** Fetch all stats DASE Hub knows how to consume. */
export async function fetchEqualifyStats(): Promise<Record<string, number>> {
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

export interface SyncResult {
    ok: boolean;
    stats?: Record<string, number>;
    updatedMetrics?: string[];
    error?: string;
    syncedAt: string;
}

/** Run the sync: fetch stats, update tagged metrics, record integration state. */
export async function syncEqualifyStats(): Promise<SyncResult> {
    const syncedAt = new Date().toISOString();
    const prior = await getIntegration('equalify');

    try {
        const stats = await fetchEqualifyStats();

        const objectives = await getObjectives();
        const updated: string[] = [];
        for (const objective of objectives) {
            let changed = false;
            for (const metric of objective.metrics) {
                if (metric.source !== 'equalify' || !metric.sourceKey) continue;
                const value = stats[metric.sourceKey];
                if (value === undefined) continue;
                const formatted = value.toLocaleString('en-US');
                metric.metric = (metric.metricTemplate || 'Count: {value}').replace('{value}', formatted);
                metric.updatedAt = syncedAt;
                metric.updatedBy = 'equalify-sync';
                updated.push(`${objective.id}/${metric.id}`);
                changed = true;
            }
            if (changed) await putObjective(objective);
        }

        await putIntegration({
            id: 'equalify',
            name: 'Equalify',
            endpoint: GRAPHQL_URL,
            lastSyncAt: syncedAt,
            lastStatus: 'ok',
            lastError: undefined,
            lastStats: stats,
            syncCount: (prior?.syncCount || 0) + 1,
        });

        return { ok: true, stats, updatedMetrics: updated, syncedAt };
    } catch (err: any) {
        await putIntegration({
            id: 'equalify',
            name: 'Equalify',
            endpoint: GRAPHQL_URL,
            lastSyncAt: prior?.lastSyncAt,
            lastStatus: 'error',
            lastError: err.message,
            lastStats: prior?.lastStats,
            syncCount: prior?.syncCount || 0,
        });
        return { ok: false, error: err.message, syncedAt };
    }
}
