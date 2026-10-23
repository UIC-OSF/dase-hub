/**
 * Key Results data layer.
 *
 * Objectives (with embedded metric rows) live in the dase-hub DynamoDB table:
 *   pk='KR_OBJECTIVE', sk=<slug>          — one item per tactical objective
 *   pk='INTEGRATION',  sk=<integrationId> — sync state per external integration
 *   pk='KR_SUBMISSION', sk=<ISO ts>       — audit trail of manual form updates
 *
 * Metric rows tagged { source: 'equalify', sourceKey } get their display value
 * overwritten by the Equalify sync (routes/internal/sync-equalify.ts); everything
 * else is manual and edited via the /submit-stats form.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'dase-hub';

export interface Metric {
    id: string;
    label: string;
    /** Display string shown in the value badge, e.g. "Count: 211" or "Total: 912 People" */
    metric: string;
    /** Progress meter fill, 0–100 */
    currentValue: number;
    status: 'high' | 'med' | 'upcoming';
    ariaLabel?: string;
    /** Integration that overwrites this value on sync; absent/manual = form-edited */
    source?: 'equalify' | 'reflow';
    /** Which synced stat feeds this metric, e.g. 'scanned_urls' (scoped per source) */
    sourceKey?: string;
    /** Template for the synced display string; {value} is replaced with the formatted number */
    metricTemplate?: string;
    /** Hidden metrics stay in the data (and keep syncing) but don't render publicly */
    hidden?: boolean;
    /** One-line, plain-language "what this counts", shown under the metric. Synced metrics get theirs from SOURCE_DEFINITIONS. */
    definition?: string;
    /** Optional goal. When set, the progress meter is value ÷ target, computed on every update and sync. */
    target?: number;
    updatedAt?: string;
    updatedBy?: string;
}

export interface Objective {
    id: string;
    title: string;
    /** Date-range line under the title. May contain {today}, rendered as the current month at view time. */
    subtitle: string;
    order: number;
    upcoming?: boolean;
    /** Hidden objectives don't render publicly (card + tactical objectives list) */
    hidden?: boolean;
    metrics: Metric[];
}

export interface IntegrationState {
    id: string;
    name: string;
    endpoint: string;
    lastSyncAt?: string;
    lastStatus?: 'ok' | 'error';
    lastError?: string;
    /** Optional sources that failed on an otherwise successful sync (e.g. CloudWatch unreachable) */
    lastWarning?: string;
    lastStats?: Record<string, number>;
    syncCount?: number;
}

/**
 * Plain-language definitions for every synced stat, keyed "<source>:<sourceKey>".
 * Written onto the metric on each sync so the dashboard, Submit Stats, and the
 * Equalify Account > Statistics tab all describe the same thing the same way.
 */
export const SOURCE_DEFINITIONS: Record<string, string> = {
    'equalify:scanned_urls': 'Web addresses (pages and documents) currently tracked in Equalify audits, across all users.',
    'equalify:scanned_html': 'Web pages (HTML) tracked in Equalify audits.',
    'equalify:scanned_pdfs': 'PDF documents tracked in Equalify audits.',
    'equalify:scanned_pdfs_red': 'PDFs tracked in audits of Red Multisite sites (audits named "RED").',
    'equalify:audits_total': 'Audits (a site or document collection set up for scanning) created in Equalify.',
    'equalify:active_users': 'Distinct UIC accounts that have created at least one audit.',
    'equalify:registered_users': 'Accounts in Equalify (UIC SSO and invited users).',
    'equalify:active_users_30d': 'Distinct accounts that signed in to Equalify in the last 30 days.',
    'equalify:new_users_30d': 'Accounts created in the last 30 days.',
    'equalify:units_served_30d': 'Distinct UIC departments (from SSO) with at least one sign-in in the last 30 days.',
    'equalify:sites_monitored_30d': 'Distinct uic.edu websites with a completed Equalify scan in the last 30 days.',
    'equalify:sites_total': 'Distinct uic.edu websites tracked in Equalify audits.',
    'equalify:uic_urls': 'uic.edu pages and documents tracked in Equalify audits.',
    'equalify:pages_scanned_30d': "Web pages and PDFs checked for accessibility issues by Equalify's scanners in the last 30 days (WCAG rules for pages, PDF/UA for documents).",
    'equalify:pages_per_day_30d': 'Average web pages and PDFs scanned per day over the last 30 days.',
    'equalify:rescan_delta_pct': 'Change in detected issues from first to latest scan, across sites rescanned with the identical set of pages. Detected, not confirmed fixed.',
    'reflow:documents_processed': 'PDFs converted to accessible, tagged output by Equalify Iris (a 40-page PDF counts once).',
    'reflow:pages_processed': 'Individual PDF pages converted to accessible HTML by Equalify Iris.',
};

export interface Submission {
    at: string;
    by: string;
    objectiveId: string;
    metricLabel: string;
    change: string;
}

/** Render a subtitle, replacing {today} with the current month (e.g. "Aug 2026"). */
export function renderSubtitle(subtitle: string): string {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'America/Chicago' });
    return subtitle.replace(/\{today\}/g, now);
}

/**
 * Split a display value like "Total: 912 People" into prefix/number/suffix so
 * forms can ask for just the number. Returns null when there's no number
 * (e.g. "Upcoming") — those fall back to a free-text field.
 */
export function parseDisplayValue(display: string): { prefix: string; value: number; suffix: string } | null {
    const match = display.match(/^(.*?)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return null;
    const value = Number(match[2].replace(/,/g, ''));
    if (Number.isNaN(value)) return null;
    return { prefix: match[1], value, suffix: match[3] };
}

/** Progress toward the goal as 0–100, or null when the metric has no goal or no numeric value. */
export function targetProgress(metric: Metric): number | null {
    if (!metric.target || metric.target <= 0) return null;
    const parsed = parseDisplayValue(metric.metric);
    if (!parsed) return null;
    return Math.max(0, Math.min(100, Math.round((parsed.value / metric.target) * 100)));
}

/** A metric with a goal gets its meter from the value, never from a hand-set fill. */
export function applyTarget(metric: Metric): void {
    const progress = targetProgress(metric);
    if (progress !== null) metric.currentValue = progress;
}

// ── Objectives ────────────────────────────────────────────────────────────────

export async function getObjectives(): Promise<Objective[]> {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'KR_OBJECTIVE' },
    }));
    const items = (result.Items || []) as (Objective & { pk: string; sk: string })[];
    return items
        .map(({ pk, sk, ...o }) => o)
        .sort((a, b) => a.order - b.order);
}

export async function getObjective(id: string): Promise<Objective | null> {
    const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'KR_OBJECTIVE', sk: id },
    }));
    if (!result.Item) return null;
    const { pk, sk, ...o } = result.Item as Objective & { pk: string; sk: string };
    return o;
}

export async function putObjective(objective: Objective): Promise<void> {
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { pk: 'KR_OBJECTIVE', sk: objective.id, ...objective },
    }));
}

export async function deleteObjective(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'KR_OBJECTIVE', sk: id },
    }));
}

/** Swap an objective's order with its neighbor above/below. */
export async function moveObjective(id: string, direction: 'up' | 'down'): Promise<boolean> {
    const objectives = await getObjectives();
    const idx = objectives.findIndex(o => o.id === id);
    if (idx === -1) return false;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= objectives.length) return false;
    const a = objectives[idx], b = objectives[swapWith];
    [a.order, b.order] = [b.order, a.order];
    await Promise.all([putObjective(a), putObjective(b)]);
    return true;
}

export async function setObjectiveHidden(id: string, hidden: boolean): Promise<boolean> {
    const objective = await getObjective(id);
    if (!objective) return false;
    objective.hidden = hidden;
    await putObjective(objective);
    return true;
}

/** An objective renders publicly if it isn't hidden and has at least one visible metric. */
export function visibleObjectives(objectives: Objective[]): Objective[] {
    return objectives
        .filter(o => !o.hidden)
        .map(o => ({ ...o, metrics: o.metrics.filter(m => !m.hidden) }))
        .filter(o => o.metrics.length > 0);
}

/** Update a single metric row inside an objective (read-modify-write). */
export async function updateMetric(
    objectiveId: string,
    metricId: string,
    patch: Partial<Metric>,
): Promise<Metric | null> {
    const objective = await getObjective(objectiveId);
    if (!objective) return null;
    const metric = objective.metrics.find(m => m.id === metricId);
    if (!metric) return null;
    Object.assign(metric, patch);
    // A patch value of undefined clears the field rather than storing an undefined attribute
    for (const key of Object.keys(metric) as (keyof Metric)[]) if (metric[key] === undefined) delete metric[key];
    applyTarget(metric);
    await putObjective(objective);
    return metric;
}

export async function addMetric(objectiveId: string, metric: Metric): Promise<boolean> {
    const objective = await getObjective(objectiveId);
    if (!objective) return false;
    applyTarget(metric);
    objective.metrics.push(metric);
    await putObjective(objective);
    return true;
}

export async function deleteMetric(objectiveId: string, metricId: string): Promise<boolean> {
    const objective = await getObjective(objectiveId);
    if (!objective) return false;
    const before = objective.metrics.length;
    objective.metrics = objective.metrics.filter(m => m.id !== metricId);
    if (objective.metrics.length === before) return false;
    await putObjective(objective);
    return true;
}

// ── Integration state ─────────────────────────────────────────────────────────

export async function getIntegration(id: string): Promise<IntegrationState | null> {
    const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'INTEGRATION', sk: id },
    }));
    if (!result.Item) return null;
    const { pk, sk, ...state } = result.Item as IntegrationState & { pk: string; sk: string };
    return state;
}

export async function putIntegration(state: IntegrationState): Promise<void> {
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { pk: 'INTEGRATION', sk: state.id, ...state },
    }));
}

// ── Manual submission log ─────────────────────────────────────────────────────

export async function logSubmission(entry: Submission): Promise<void> {
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { pk: 'KR_SUBMISSION', sk: `${entry.at}#${Math.random().toString(36).slice(2, 6)}`, ...entry },
    }));
}

export async function getRecentSubmissions(limit: number = 15): Promise<Submission[]> {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'KR_SUBMISSION' },
        ScanIndexForward: false,
        Limit: limit,
    }));
    return (result.Items || []) as unknown as Submission[];
}

// ── Seed (Jemma's prototype data, Equalify-fed metrics tagged for sync) ───────

export const SEED_OBJECTIVES: Objective[] = [
    {
        id: 'equalify-scanning', order: 5,
        title: 'Equalify Scanning', subtitle: 'Live stats, synced from Equalify',
        metrics: [
            { id: 'scanned-urls', label: 'Scanned URLs', metric: 'Count: —', currentValue: 95, status: 'high', source: 'equalify', sourceKey: 'scanned_urls', metricTemplate: 'Count: {value}' },
            { id: 'scanned-html', label: 'HTML Pages Scanned', metric: 'Count: —', currentValue: 90, status: 'high', source: 'equalify', sourceKey: 'scanned_html', metricTemplate: 'Count: {value}' },
            { id: 'scanned-pdfs', label: 'PDFs Scanned (All)', metric: 'Count: —', currentValue: 90, status: 'high', source: 'equalify', sourceKey: 'scanned_pdfs', metricTemplate: 'Count: {value}' },
            { id: 'scanned-pdfs-red', label: 'PDFs Scanned (RED)', metric: 'Count: —', currentValue: 88, status: 'high', source: 'equalify', sourceKey: 'scanned_pdfs_red', metricTemplate: 'Count: {value}' },
        ],
    },
    {
        id: 'equalify-usage', order: 6,
        title: 'Equalify Users & Audits', subtitle: 'Live stats, synced from Equalify',
        metrics: [
            { id: 'registered-users', label: 'Registered users', metric: 'Users: —', currentValue: 60, status: 'high', source: 'equalify', sourceKey: 'registered_users', metricTemplate: 'Users: {value}' },
            { id: 'active-users-30d', label: 'Active users (30 days)', metric: 'Users: —', currentValue: 50, status: 'med', source: 'equalify', sourceKey: 'active_users_30d', metricTemplate: 'Users: {value}' },
            { id: 'units-served-30d', label: 'Departments served (30 days)', metric: 'Count: —', currentValue: 50, status: 'med', source: 'equalify', sourceKey: 'units_served_30d', metricTemplate: 'Count: {value}' },
            { id: 'active-users', label: "Users who've created an audit", metric: 'Users: —', currentValue: 35, status: 'med', source: 'equalify', sourceKey: 'active_users', metricTemplate: 'Users: {value}' },
            { id: 'audits', label: 'Audits', metric: 'Count: —', currentValue: 80, status: 'high', source: 'equalify', sourceKey: 'audits_total', metricTemplate: 'Count: {value}' },
        ],
    },
    {
        id: 'equalify-reflow', order: 7,
        title: 'Equalify Iris', subtitle: 'Live stats, synced from Iris',
        metrics: [
            { id: 'documents', label: 'Documents Converted', metric: 'Count: —', currentValue: 50, status: 'high', source: 'reflow', sourceKey: 'documents_processed', metricTemplate: 'Count: {value}' },
            { id: 'pages', label: 'Pages Converted', metric: 'Count: —', currentValue: 50, status: 'high', source: 'reflow', sourceKey: 'pages_processed', metricTemplate: 'Count: {value}' },
        ],
    },
    {
        // Coverage, detection, and improvement against the standard Title II requires (WCAG 2.1 AA).
        // Deadline for public entities serving 50,000+ people, per DOJ's April 2026 interim final rule.
        id: 'title-ii', order: 8,
        title: 'ADA Title II Readiness', subtitle: 'WCAG 2.1 AA · Deadline Apr 26, 2027',
        metrics: [
            { id: 'sites-monitored', label: 'Websites monitored (30 days)', metric: 'Count: —', currentValue: 80, status: 'high', source: 'equalify', sourceKey: 'sites_monitored_30d', metricTemplate: 'Count: {value}' },
            { id: 'pages-scanned-30d', label: 'Pages scanned (30 days)', metric: 'Count: —', currentValue: 90, status: 'high', source: 'equalify', sourceKey: 'pages_scanned_30d', metricTemplate: 'Count: {value}' },
            { id: 'uic-urls', label: 'UIC web addresses tracked', metric: 'Count: —', currentValue: 85, status: 'high', source: 'equalify', sourceKey: 'uic_urls', metricTemplate: 'Count: {value}' },
            { id: 'rescan-delta', label: 'Detected issues on rescanned sites', metric: 'Change: —', currentValue: 25, status: 'med', source: 'equalify', sourceKey: 'rescan_delta_pct', metricTemplate: '{value}%' },
        ],
    },
    {
        id: 'promote-awareness', order: 10,
        title: 'Promote General Accessibility Awareness', subtitle: 'Oct 2025 - {today}',
        metrics: [
            { id: 'training-complete', label: 'Completion of Training', metric: 'Count: 211', currentValue: 70, status: 'high' },
            { id: 'training-progress', label: 'Training in Progress', metric: 'Count: 112', currentValue: 40, status: 'med' },
            { id: 'colleges', label: 'Number of participating colleges', metric: 'Count: 33', currentValue: 90, status: 'high' },
            { id: 'departments', label: 'Number of participating departments', metric: 'Count: 75', currentValue: 90, status: 'high' },
        ],
    },
    {
        id: 'deliver-training', order: 20,
        title: 'Deliver Comprehensive Accessibility Training', subtitle: 'Jan 2025 - {today}',
        metrics: [
            { id: 'webinar-attendees', label: 'Monthly Accessibility Webinar Attendees', metric: 'Total: 912 People', currentValue: 91, status: 'high' },
            { id: 'dept-attendees', label: 'Department & Unit Training Attendees', metric: 'Total: 175 People', currentValue: 80, status: 'high' },
        ],
    },
    {
        id: 'consultation', order: 30,
        title: 'Provide Consultation Services', subtitle: 'Dec 2025 - {today}',
        metrics: [
            { id: 'tickets', label: 'Help Desk Tickets Resolved', metric: 'Closed: 263', currentValue: 95, status: 'high' },
            { id: 'office-hours', label: 'Office Hours', metric: 'Total: 56 Hours', currentValue: 25, status: 'med' },
            { id: 'one-on-one', label: 'One on One Consultation', metric: 'Total: 55 People', currentValue: 35, status: 'high' },
        ],
    },
    {
        id: 'outreach', order: 40,
        title: 'Expand Accessibility Outreach & Partnerships', subtitle: 'May 2024 - {today}',
        metrics: [
            { id: 'liaisons', label: 'UIC Accessibility Liaisons', metric: 'Total: 56', currentValue: 56, status: 'med' },
            { id: 'depts-engaged', label: 'Departments Engaged', metric: 'Count: 62', currentValue: 62, status: 'med' },
        ],
    },
    {
        id: 'audit-assets', order: 50,
        title: 'Audit UIC Digital Assets', subtitle: 'October 2025',
        metrics: [
            {
                id: 'scanned-urls', label: 'Equalify Scanned URLs', metric: 'Count: 159,222', currentValue: 95, status: 'high',
                source: 'equalify', sourceKey: 'scanned_urls', metricTemplate: 'Count: {value}',
            },
            {
                id: 'scanned-pdfs-red', label: 'Equalify Scanned PDFs (RED)', metric: 'Count: 4,895', currentValue: 90, status: 'high',
                source: 'equalify', sourceKey: 'scanned_pdfs_red', metricTemplate: 'Count: {value}',
            },
            {
                id: 'equalify-users', label: 'UIC Users on Equalify Dashboard', metric: 'Users: 35', currentValue: 35, status: 'med',
                source: 'equalify', sourceKey: 'active_users', metricTemplate: 'Users: {value}',
            },
            { id: 'scanned-pdfs-blackboard', label: 'Equalify Scanned PDFs (Blackboard)', metric: 'Count: 7,610', currentValue: 88, status: 'high' },
        ],
    },
    {
        id: 'compliance', order: 60,
        title: 'Enhance Digital Compliance & Standards', subtitle: 'Jan 2026',
        metrics: [
            { id: 'sites-audited', label: 'Number of UIC Sites Audited', metric: 'Count: 1,014', currentValue: 100, status: 'high' },
            { id: 'a11y-score', label: 'Accessibility Score of Scanned UIC Websites', metric: 'Score: 62%', currentValue: 62, status: 'med' },
        ],
    },
    {
        id: 'launch-equalify', order: 70, upcoming: true,
        title: 'Launch & Integrate Equalify Platform', subtitle: 'Feb 2026 - June 2026',
        metrics: [
            { id: 'status', label: 'Status', metric: 'Upcoming', currentValue: 0, status: 'upcoming' },
        ],
    },
    {
        id: 'ai-open-source', order: 80, upcoming: true,
        title: 'Champion AI Innovation & Open Source', subtitle: 'Feb 2026 - June 2026',
        metrics: [
            { id: 'status', label: 'Status', metric: 'Upcoming', currentValue: 0, status: 'upcoming' },
        ],
    },
];

/** Seed objectives if the table has none. Returns objectives either way. */
export async function getOrSeedObjectives(): Promise<Objective[]> {
    const existing = await getObjectives();
    if (existing.length > 0) return existing;
    await Promise.all(SEED_OBJECTIVES.map(o => putObjective(o)));
    return SEED_OBJECTIVES.slice().sort((a, b) => a.order - b.order);
}
