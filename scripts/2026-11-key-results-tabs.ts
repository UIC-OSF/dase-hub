/**
 * One-off migration (Nov 2026): Key Results tabs for the directors/CFO review.
 *
 *   1. Give every card an explicit tab (ADA Title II / Service Team / Equalify).
 *   2. Add the Highlights row (tiles above the tabs): service satisfaction and
 *      the consultation and evaluation increases Jemma reported.
 *   3. Flag Title II work that lives on other cards so it also appears on the
 *      ADA Title II tab.
 *   4. Hide "Equalify Users & Audits" and "Websites monitored (30 days)" (both
 *      stay in the data and keep syncing; re-show them on /admin).
 *   5. Make "Equalify Scanning" full width, since it's now alone on its tab.
 *
 * Run from the repo root:
 *   AWS_PROFILE=equalifyuic AWS_REGION=us-east-2 npx tsx scripts/2026-11-key-results-tabs.ts
 *
 * Safe to re-run: fields that are already set are left alone.
 */
import { getObjectives, putObjective, logSubmission, tabOf, Objective, TabId } from '#src/utils/keyResults';

const now = new Date().toISOString();
const objectives = await getObjectives();
const byId = new Map(objectives.map(o => [o.id, o]));
const changed = new Set<Objective>();

// 1. Explicit tabs (tabOf() already defaults these; storing them makes /admin the source of truth)
const TABS: Record<string, TabId> = {
    'title-ii': 'title-ii', 'equalify-reflow': 'title-ii', 'compliance': 'title-ii',
    'accessibility-training-education': 'service', 'digital-resources-engagement': 'service',
    'consultation-evaluation': 'service', 'most-requested-accessibility-topics': 'service',
    'most-discussed-accessibility-tools': 'service', 'promote-awareness': 'service', 'outreach': 'service',
    'equalify-scanning': 'equalify', 'equalify-usage': 'equalify', 'audit-assets': 'equalify',
    'launch-equalify': 'equalify', 'ai-open-source': 'equalify',
};
for (const objective of objectives) {
    if (objective.tab) continue;
    objective.tab = TABS[objective.id] ?? tabOf(objective);
    changed.add(objective);
    console.log(`tab: ${objective.id} → ${objective.tab}`);
}

// 2. Highlights row
if (!byId.has('highlights')) {
    const highlights: Objective = {
        id: 'highlights', title: 'Highlights', subtitle: 'Shown above the tabs on Key Results', order: 5, tab: 'highlights',
        metrics: [
            {
                id: 'satisfaction', label: 'Service satisfaction rating', metric: '93%', currentValue: 93, status: 'high',
                definition: "Satisfaction rating for the Digital Accessibility team's services, FY25 + FY26 (TDX).",
                updatedAt: now, updatedBy: 'Chris',
            },
            {
                id: 'consultations', label: 'Consultations', metric: '191 Consultations', currentValue: 100, status: 'high', baseline: 79,
                definition: 'Accessibility consultations provided by the Digital Accessibility team.',
                updatedAt: now, updatedBy: 'Chris',
            },
            {
                id: 'evaluations', label: 'Accessibility evaluations with Equalify', metric: '102 Evaluations', currentValue: 100, status: 'high', baseline: 31,
                definition: 'Accessibility evaluations completed using the Equalify dashboard.',
                updatedAt: now, updatedBy: 'Chris',
            },
        ],
    };
    objectives.push(highlights);
    changed.add(highlights);
    console.log('added highlights row');
}

// 3. Title II work on other cards
const ALSO_ON_TITLE_II: [string, string][] = [
    ['digital-resources-engagement', 'ada-title-ii-compliance-roadmap-template'],
    ['accessibility-training-education', 'training-sessions-delivered'],
];
for (const [objectiveId, metricId] of ALSO_ON_TITLE_II) {
    const objective = byId.get(objectiveId);
    const metric = objective?.metrics.find(m => m.id === metricId);
    if (!objective || !metric) { console.log(`not found, skipped: ${objectiveId}/${metricId}`); continue; }
    if (metric.alsoOn) continue;
    metric.alsoOn = 'title-ii';
    changed.add(objective);
    console.log(`also on Title II tab: ${metric.label}`);
}

// 4. Hide two items to make room
const usage = byId.get('equalify-usage');
if (usage && !usage.hidden) { usage.hidden = true; changed.add(usage); console.log('hid card: Equalify Users & Audits'); }
const sitesMonitored = byId.get('title-ii')?.metrics.find(m => m.id === 'sites-monitored');
if (sitesMonitored && !sitesMonitored.hidden) { sitesMonitored.hidden = true; changed.add(byId.get('title-ii')!); console.log('hid metric: Websites monitored (30 days)'); }

// 5. The Equalify tab's only card spans the row
const scanning = byId.get('equalify-scanning');
if (scanning && scanning.wide === undefined) { scanning.wide = true; changed.add(scanning); console.log('full width: Equalify Scanning'); }

for (const objective of changed) await putObjective(objective);
if (changed.size) {
    await logSubmission({
        at: now, by: 'Chris', objectiveId: 'highlights', metricLabel: 'Key Results layout',
        change: 'Split Key Results into ADA Title II / Service Team / Equalify tabs, added the Highlights row, flagged Title II work from other cards, hid Equalify Users & Audits and Websites monitored (30 days), and made Equalify Scanning full width',
    });
}
console.log(`done: ${changed.size} card${changed.size === 1 ? '' : 's'} written`);
