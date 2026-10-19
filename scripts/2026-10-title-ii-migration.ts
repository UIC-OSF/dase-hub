/**
 * One-off migration (Oct 2026): bring the live Key Results table in line with
 * the seed after the stats cleanup for the directors meeting.
 *
 *   1. "Equalify Users & Audits" card: registered / active (30d) / departments
 *      served / users who've created an audit / audits, with definitions.
 *   2. Add the "ADA Title II Readiness" card (synced metrics; values arrive on
 *      the next sync).
 *   3. Seed plain-language definitions on existing manual metrics that don't
 *      have one yet. Helen / Michael can refine them on /submit-stats.
 *   4. Rename the "Equalify Reflow" card to "Equalify Iris" (product rename,
 *      Oct 2026) so the dashboard matches equalify.uic.edu/iris.
 *   5. Shorten the Title II "sites monitored" label so it fits on one line.
 *
 * Run from the repo root (reads the live table, so use the real profile):
 *   AWS_PROFILE=equalifyuic AWS_REGION=us-east-2 npx tsx scripts/2026-10-title-ii-migration.ts
 *
 * Safe to re-run: existing values, timestamps, and visibility are preserved,
 * and definitions are only filled where missing.
 */
import { getObjectives, putObjective, SEED_OBJECTIVES, Metric } from '#src/utils/keyResults';

const MANUAL_DEFINITIONS: Record<string, string> = {
    'deliver-training/webinar-attendees': 'Cumulative attendance at the monthly accessibility webinar series since Jan 2025, reported by Digital Accessibility Services.',
    'deliver-training/dept-attendees': 'People trained in department- and unit-specific sessions since Jan 2025, reported by Digital Accessibility Services.',
    'consultation/tickets': 'Help desk tickets resolved by the Digital Accessibility team since Dec 2025.',
    'consultation/office-hours': 'Hours of open accessibility office hours held since Dec 2025.',
    'consultation/one-on-one': 'People who received a one-on-one accessibility consultation since Dec 2025.',
    'audit-assets/scanned-pdfs-blackboard': 'PDFs in Blackboard courses scanned for accessibility (entered manually; not yet an Equalify source).',
    'promote-awareness/training-complete': 'Staff and faculty who completed the digital accessibility training.',
    'promote-awareness/training-progress': 'Staff and faculty currently partway through the digital accessibility training.',
    'promote-awareness/colleges': 'Colleges with at least one training participant.',
    'promote-awareness/departments': 'Departments with at least one training participant.',
    'outreach/liaisons': 'UIC Accessibility Liaisons enrolled in the liaison program.',
    'outreach/depts-engaged': 'Departments engaged through the liaison program and outreach.',
};

const seed = (id: string) => {
    const objective = SEED_OBJECTIVES.find(o => o.id === id);
    if (!objective) throw new Error(`Seed objective "${id}" not found`);
    return objective;
};

const objectives = await getObjectives();
const byId = new Map(objectives.map(o => [o.id, o]));

// 1. Users card — take the seed's metric list, keep anything already synced for metrics that exist
const usage = byId.get('equalify-usage');
if (usage) {
    const seedUsage = seed('equalify-usage');
    const existing = new Map(usage.metrics.map(m => [m.id, m]));
    usage.title = seedUsage.title;
    usage.metrics = seedUsage.metrics.map((template): Metric => {
        const old = existing.get(template.id);
        if (!old) return { ...template };
        const { metric, currentValue, updatedAt, updatedBy, hidden } = old;
        return { ...template, metric, currentValue, ...(updatedAt ? { updatedAt } : {}), ...(updatedBy ? { updatedBy } : {}), ...(hidden ? { hidden } : {}) };
    });
    await putObjective(usage);
    console.log(`updated equalify-usage: ${usage.metrics.map(m => m.label).join(' · ')}`);
} else {
    console.log('equalify-usage not found in table; skipped');
}

// 2. Title II card
if (byId.has('title-ii')) {
    console.log('title-ii already exists; left as-is');
} else {
    await putObjective(seed('title-ii'));
    console.log('added title-ii card');
}

// 3. Definitions on manual metrics
for (const objective of objectives) {
    if (objective.id === 'equalify-usage') continue; // already written above
    let changed = 0;
    for (const metric of objective.metrics) {
        const definition = MANUAL_DEFINITIONS[`${objective.id}/${metric.id}`];
        if (definition && !metric.definition) {
            metric.definition = definition;
            changed++;
        }
    }
    if (changed) {
        await putObjective(objective);
        console.log(`${objective.id}: ${changed} definition${changed === 1 ? '' : 's'} added`);
    }
}
// 4. Reflow → Iris
const iris = byId.get('equalify-reflow');
if (iris && iris.title !== 'Equalify Iris') {
    iris.title = 'Equalify Iris';
    await putObjective(iris);
    console.log('renamed equalify-reflow card to "Equalify Iris"');
}
// 5. Shorter label so it doesn't wrap on the card (the definition still says uic.edu)
const titleII = byId.get('title-ii');
const sitesMetric = titleII?.metrics.find(m => m.id === 'sites-monitored');
if (titleII && sitesMetric && sitesMetric.label === 'UIC websites monitored (30 days)') {
    sitesMetric.label = 'Websites monitored (30 days)';
    await putObjective(titleII);
    console.log('relabeled title-ii/sites-monitored');
}
console.log('done');
