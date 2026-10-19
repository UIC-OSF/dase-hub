/**
 * Equalify Iris (formerly Reflow) stats sync.
 *
 * Pulls conversion counters from the Iris service's public stats endpoint and
 * writes them into any Key Results metric tagged { source: 'reflow', sourceKey }.
 *
 * Endpoint notes (from the Reflow team):
 *   - Unauthenticated on purpose; Cache-Control max-age=60; counters are
 *     monotonic (derived from write-once first_completed_at).
 *   - `since` = when the earliest counted document finished (null before any).
 *     We use it to keep the Reflow card's date range accurate automatically.
 *
 * Available sourceKeys:
 *   documents_processed — sessions counted once ready_for_review (40-page PDF = 1)
 *   pages_processed     — distinct page images converted to accessible HTML
 */
import { getObjectives, putObjective, getIntegration, putIntegration, SOURCE_DEFINITIONS } from '#src/utils/keyResults';

const REFLOW_STATS_URL = process.env.REFLOW_STATS_URL || 'https://iris.equalify.uic.edu/v1/stats';

/** The card whose subtitle tracks the API's `since` field. */
const REFLOW_OBJECTIVE_ID = 'equalify-reflow';

interface ReflowStats {
    pages_processed: number;
    documents_processed: number;
    since: string | null;
}

export async function fetchReflowStats(): Promise<ReflowStats> {
    const response = await fetch(REFLOW_STATS_URL, {
        headers: { 'User-Agent': 'DASE-Hub' },
    });
    if (!response.ok) throw new Error(`Reflow stats HTTP ${response.status}`);
    return response.json();
}

export interface SyncResult {
    ok: boolean;
    stats?: Record<string, number>;
    updatedMetrics?: string[];
    error?: string;
    syncedAt: string;
}

export async function syncReflowStats(): Promise<SyncResult> {
    const syncedAt = new Date().toISOString();
    const prior = await getIntegration('reflow');

    try {
        const raw = await fetchReflowStats();
        const stats: Record<string, number> = {
            documents_processed: raw.documents_processed,
            pages_processed: raw.pages_processed,
        };

        const objectives = await getObjectives();
        const updated: string[] = [];
        for (const objective of objectives) {
            let changed = false;
            for (const metric of objective.metrics) {
                if (metric.source !== 'reflow' || !metric.sourceKey) continue;
                const definition = SOURCE_DEFINITIONS[`reflow:${metric.sourceKey}`];
                if (definition && metric.definition !== definition) {
                    metric.definition = definition;
                    changed = true;
                }
                const value = stats[metric.sourceKey];
                if (value === undefined) continue;
                metric.metric = (metric.metricTemplate || 'Count: {value}').replace('{value}', value.toLocaleString('en-US'));
                metric.updatedAt = syncedAt;
                metric.updatedBy = 'reflow-sync';
                updated.push(`${objective.id}/${metric.id}`);
                changed = true;
            }
            // Keep the Reflow card's date range anchored to the API's `since`
            if (objective.id === REFLOW_OBJECTIVE_ID && raw.since) {
                const sinceMonth = new Date(raw.since).toLocaleDateString('en-US', {
                    month: 'short', year: 'numeric', timeZone: 'America/Chicago',
                });
                const subtitle = `${sinceMonth} - {today}`;
                if (objective.subtitle !== subtitle) {
                    objective.subtitle = subtitle;
                    changed = true;
                }
            }
            if (changed) await putObjective(objective);
        }

        await putIntegration({
            id: 'reflow',
            name: 'Equalify Iris',
            endpoint: REFLOW_STATS_URL,
            lastSyncAt: syncedAt,
            lastStatus: 'ok',
            lastError: undefined,
            lastStats: stats,
            syncCount: (prior?.syncCount || 0) + 1,
        });

        return { ok: true, stats, updatedMetrics: updated, syncedAt };
    } catch (err: any) {
        await putIntegration({
            id: 'reflow',
            name: 'Equalify Iris',
            endpoint: REFLOW_STATS_URL,
            lastSyncAt: prior?.lastSyncAt,
            lastStatus: 'error',
            lastError: err.message,
            lastStats: prior?.lastStats,
            syncCount: prior?.syncCount || 0,
        });
        return { ok: false, error: err.message, syncedAt };
    }
}
