import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { getOrSeedObjectives, visibleObjectives, renderSubtitle, targetProgress, parseDisplayValue, tabOf, isWide, isRanked, TAB_LABELS, Objective, Metric, TabId } from '#src/utils/keyResults';

const styles = `
.kr-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px 64px;
}
.kr-container > h1 {
    font-size: 32px;
    font-weight: 700;
    color: #001e62;
    margin: 0 0 4px;
}
.kr-intro {
    color: #4b5563;
    margin: 0 0 32px;
    font-size: 15px;
}
/* Key result cards */
.kr-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
@media (max-width: 1000px) { .kr-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 680px)  { .kr-grid { grid-template-columns: 1fr; } }
.kr-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-top: 4px solid #C8102E;
    border-radius: 10px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.kr-card h3 {
    font-size: 17px;
    font-weight: 700;
    color: #001e62;
    margin: 0 0 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}
.kr-card .kr-dates {
    font-size: 13px;
    color: #4b5563;
    margin: 0 0 16px;
}
.kr-metric { margin-bottom: 18px; }
.kr-metric:last-child { margin-bottom: 0; }
.kr-metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}
.kr-metric-label {
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
}
.kr-badge {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    color: #1f2937;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 4px 10px;
    white-space: nowrap;
}
.kr-badge.upcoming { color: #4b5563; }
.kr-meter {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}
.kr-meter-fill {
    height: 100%;
    background: #2e7d32;
    border-radius: 4px;
}
.kr-source {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #4b5563;
    margin-top: 4px;
}
.kr-footer-note {
    margin-top: 32px;
    font-size: 13px;
    color: #4b5563;
    text-align: center;
}
.kr-footer-note a { color: #C8102E; }
.kr-def {
    font-size: 12px;
    color: #4b5563;
    margin: 5px 0 0;
    line-height: 1.45;
}
.kr-goal { font-size: 12px; font-weight: 600; color: #001e62; margin: 4px 0 0; }
/* Trend chart (Title II card) */
.kr-trend { margin: 0 0 18px; padding: 12px 12px 8px; background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; }
.kr-trend figcaption { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.kr-trend-label { font-size: 13px; font-weight: 600; color: #1f2937; }
.kr-trend-growth { font-size: 12px; font-weight: 700; color: #2e7d32; white-space: nowrap; }
.kr-trend svg { display: block; width: 100%; height: auto; }
.kr-trend-axis { stroke: #d1d5db; stroke-width: 1; }
.kr-trend-area { fill: #2e7d32; fill-opacity: 0.12; }
.kr-trend-line { fill: none; stroke: #2e7d32; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
.kr-trend-dot { fill: #2e7d32; stroke: #ffffff; stroke-width: 2; }
.kr-trend-value { font-size: 12px; font-weight: 700; fill: #001e62; }
.kr-trend-tick { font-size: 10px; fill: #6b7280; }
.kr-trend-note { margin: 4px 0 0; font-size: 11px; color: #6b7280; }
.kr-trend-pt { fill: #2e7d32; stroke: #ffffff; stroke-width: 1.5; }
.kr-trend-mini { font-size: 9px; font-weight: 600; fill: #4b5563; }
.kr-trend-data summary { margin-top: 6px; font-size: 11px; font-weight: 600; color: #C8102E; cursor: pointer; }
.kr-trend-data table { margin-top: 6px; border-collapse: collapse; font-size: 12px; }
.kr-trend-data th { text-align: left; font-weight: 500; color: #4b5563; padding: 2px 12px 2px 0; }
.kr-trend-data td { text-align: right; color: #1f2937; padding: 2px 0; font-variant-numeric: tabular-nums; }
.kr-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.kr-from { font-size: 11px; font-weight: 600; color: #001e62; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 0.03em; }

/* Highlights: stat tiles above the tabs */
.kr-highlights { margin: 0 0 36px; }
.kr-highlights > h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #C8102E; margin: 0 0 12px; }
.kr-tiles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 1000px) { .kr-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px)  { .kr-tiles { grid-template-columns: minmax(0, 1fr); } }
.kr-tile { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.kr-tile-label { font-size: 13px; font-weight: 600; color: #4b5563; margin: 0; }
.kr-tile-big { font-size: 34px; font-weight: 800; line-height: 1.1; color: #001e62; margin: 0; font-variant-numeric: tabular-nums; }
.kr-tile-big.kr-up { color: #2e7d32; }
.kr-tile-def { font-size: 12px; color: #4b5563; margin: 2px 0 0; line-height: 1.45; }
.kr-tile-deadline { background: #001e62; border-color: #001e62; }
.kr-tile-deadline .kr-tile-label, .kr-tile-deadline .kr-tile-def { color: #dbe3f3; }
.kr-tile-deadline .kr-tile-big { color: #ffffff; }
.kr-compare { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 5px 8px; align-items: center; font-size: 12px; margin-top: 4px; }
.kr-compare-label { color: #4b5563; }
.kr-compare-bar { height: 10px; background: #eef2f7; border-radius: 3px; overflow: hidden; }
.kr-compare-bar span { display: block; height: 100%; border-radius: 3px; }
.kr-before { background: #94a3b8; }
.kr-after { background: #2e7d32; }
.kr-compare-value { font-weight: 700; color: #1f2937; text-align: right; font-variant-numeric: tabular-nums; }

/* Tabs (WAI-ARIA tabs pattern; without JavaScript every section shows, stacked) */
.kr-tabs { display: flex; flex-wrap: wrap; gap: 6px; width: fit-content; max-width: 100%; margin: 0 0 28px; padding: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; }
.kr-tabs[hidden] { display: none; }
.kr-tabs [role="tab"] { font: inherit; font-size: 15px; font-weight: 600; color: #1f2937; background: transparent; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; }
.kr-tabs [role="tab"]:hover { background: #e2e8f0; }
.kr-tabs [role="tab"][aria-selected="true"] { background: #001e62; color: #ffffff; }
.kr-tabs [role="tab"]:focus-visible { outline: 3px solid #C8102E; outline-offset: 2px; }
.kr-panel > h2 { font-size: 24px; font-weight: 700; color: #001e62; margin: 0 0 4px; }
.kr-panel-desc { color: #4b5563; font-size: 15px; margin: 0 0 20px; }
.kr-panel + .kr-panel { margin-top: 48px; }
.kr-tabs-ready .kr-panel + .kr-panel { margin-top: 0; }
/* A class rather than [hidden]: the base stylesheet's [hidden] rule can't be undone for print */
.kr-tabs-ready .kr-panel.kr-inactive { display: none; }
.kr-panel:focus-visible { outline: 3px solid #C8102E; outline-offset: 8px; border-radius: 4px; }
/* Full-width card: chart beside the metrics, metrics in columns */
.kr-card-wide { grid-column: 1 / -1; }
.kr-wide-body { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.kr-wide-body .kr-trend { margin: 0; }
.kr-wide-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px 24px; align-content: start; }
.kr-wide-metrics .kr-metric { margin: 0; }
@media (max-width: 900px) { .kr-wide-body { grid-template-columns: minmax(0, 1fr); } }
/* Ranked "top" lists: rank first, no progress bars */
.kr-rank { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.kr-rank-item { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 12px; align-items: start; }
.kr-rank-no { width: 30px; height: 30px; border-radius: 50%; background: #001e62; color: #ffffff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
.kr-rank-label { font-size: 15px; font-weight: 600; color: #1f2937; margin: 4px 0 0; }
.kr-rank .kr-def { margin-top: 3px; }
@media print {
    .kr-tabs { display: none !important; }
    .kr-tabs-ready .kr-panel.kr-inactive { display: block; }
    .kr-tabs-ready .kr-panel + .kr-panel { margin-top: 32px; }
}
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

const MetricRow: FC<{ metric: Metric; from?: string }> = ({ metric, from }) => (
    <div class="kr-metric">
        <div class="kr-metric-row">
            <span class="kr-metric-label">{metric.label}</span>
            <span class={`kr-badge ${metric.status === 'upcoming' ? 'upcoming' : ''}`}>{metric.metric}</span>
        </div>
        <div
            class="kr-meter"
            role="progressbar"
            aria-valuenow={metric.currentValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={metric.ariaLabel || `${metric.label}: ${metric.metric}`}
        >
            <div class="kr-meter-fill" style={`width:${Math.max(0, Math.min(100, metric.currentValue))}%;`}></div>
        </div>
        {from && <p class="kr-from">From {from}</p>}
        {metric.definition && <p class="kr-def">{metric.definition}</p>}
        {metric.target ? <p class="kr-goal">Goal: {metric.target.toLocaleString('en-US')} · {targetProgress(metric) ?? 0}% there</p> : null}
        {metric.source && (
            <span class="kr-source" title={metric.updatedAt ? `Synced ${timeAgo(metric.updatedAt)}` : undefined}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
                Synced from {metric.source === 'reflow' ? 'Iris' : 'Equalify'}{metric.updatedAt ? ` · ${timeAgo(metric.updatedAt)}` : ''}
            </span>
        )}
    </div>
);

// Monthly snapshot of cumulative uic.edu web addresses tracked in Equalify, computed
// 2026-10-16 from the urls table (created_at by month). A stopgap for the directors
// meeting: the sync should write a monthly series next sprint so this stops being hardcoded.
const TITLE_II_TREND = {
    label: 'UIC web addresses tracked',
    note: 'Cumulative by month added, Jan–Oct 2026 · Equalify (snapshot Oct 16)',
    points: [
        { month: 'Jan', value: 3845 }, { month: 'Feb', value: 11243 }, { month: 'Mar', value: 14520 },
        { month: 'Apr', value: 20610 }, { month: 'May', value: 28955 }, { month: 'Jun', value: 49567 },
        { month: 'Jul', value: 63095 }, { month: 'Aug', value: 81821 }, { month: 'Sep', value: 82447 },
        { month: 'Oct', value: 88698 },
    ],
};

const TrendChart: FC = () => {
    const { points } = TITLE_II_TREND;
    const W = 320, H = 120, left = 8, right = 60, top = 14, bottom = 22;
    const plotW = W - left - right, plotH = H - top - bottom;
    const max = Math.max(...points.map(p => p.value));
    const x = (i: number) => left + (i / (points.length - 1)) * plotW;
    const y = (v: number) => top + plotH - (v / max) * plotH;
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const baseline = (top + plotH).toFixed(1);
    const area = `${line} L${x(points.length - 1).toFixed(1)},${baseline} L${left},${baseline} Z`;
    const first = points[0], last = points[points.length - 1];
    const growth = Math.round(last.value / first.value);
    const compact = (v: number) => `${(v / 1000).toFixed(1)}k`;
    const lastIdx = points.length - 1;
    return (
        <figure class="kr-trend">
            <figcaption>
                <span class="kr-trend-label">{TITLE_II_TREND.label}</span>
                <span class="kr-trend-growth">{growth}× since {first.month}</span>
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} role="img"
                aria-label={`${TITLE_II_TREND.label}, cumulative by month: ${first.value.toLocaleString('en-US')} in ${first.month} 2026, rising to ${last.value.toLocaleString('en-US')} in ${last.month} 2026.`}>
                <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} class="kr-trend-axis" />
                <path d={area} class="kr-trend-area" />
                <path d={line} class="kr-trend-line" />
                {points.map((p, i) => i < lastIdx ? (
                    <circle cx={x(i)} cy={y(p.value)} r="3" class="kr-trend-pt">
                        <title>{p.month} 2026: {p.value.toLocaleString('en-US')}</title>
                    </circle>
                ) : null)}
                <circle cx={x(lastIdx)} cy={y(last.value)} r="4" class="kr-trend-dot">
                    <title>{last.month} 2026: {last.value.toLocaleString('en-US')}</title>
                </circle>
                <text x={x(lastIdx) + 8} y={y(last.value) + 4} class="kr-trend-value">{last.value.toLocaleString('en-US')}</text>
                {points.map((p, i) => (i % 3 === 0 && i < lastIdx) ? (
                    <text x={i === 0 ? x(i) + 2 : x(i) - 5} y={y(p.value) - 9} text-anchor={i === 0 ? 'start' : 'end'} class="kr-trend-mini">{compact(p.value)}</text>
                ) : null)}
                {points.map((p, i) => (i % 3 === 0 || i === lastIdx) ? (
                    <text x={x(i)} y={H - 6} text-anchor={i === 0 ? 'start' : i === lastIdx ? 'end' : 'middle'} class="kr-trend-tick">{p.month}</text>
                ) : null)}
            </svg>
            <p class="kr-trend-note">{TITLE_II_TREND.note}</p>
            <details class="kr-trend-data">
                <summary>Monthly numbers</summary>
                <table>
                    <tbody>
                        {points.map(p => (
                            <tr><th scope="row">{p.month} 2026</th><td>{p.value.toLocaleString('en-US')}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
};

// ADA Title II compliance date for public entities serving 50,000+ people (DOJ interim final rule, Apr 2026)
const TITLE_II_DEADLINE = { iso: '2027-04-26', label: 'April 26, 2027' };

function daysUntil(isoDate: string): number {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return Math.round((Date.parse(isoDate) - Date.parse(today)) / 86400000);
}

const fmt = (value: number) => value.toLocaleString('en-US');

/** One stat tile. With a baseline it shows the % change and before/after bars; otherwise the value itself. */
const HighlightTile: FC<{ metric: Metric }> = ({ metric }) => {
    const parsed = parseDisplayValue(metric.metric);
    const base = metric.baseline;
    if (parsed && base && base > 0) {
        const current = parsed.value;
        const change = Math.round(((current - base) / base) * 100);
        const max = Math.max(current, base);
        return (
            <li class="kr-tile">
                <p class="kr-tile-label">{metric.label}</p>
                <p class={`kr-tile-big ${change >= 0 ? 'kr-up' : ''}`}>
                    {change > 0 ? '+' : change < 0 ? '−' : ''}{fmt(Math.abs(change))}%
                    <span class="kr-sr"> {change >= 0 ? 'increase' : 'decrease'}</span>
                </p>
                <div class="kr-compare">
                    <span class="kr-compare-label">{metric.baselineLabel || 'Earlier'}</span>
                    <span class="kr-compare-bar" aria-hidden="true"><span class="kr-before" style={`width:${((base / max) * 100).toFixed(1)}%;`}></span></span>
                    <span class="kr-compare-value">{fmt(base)}</span>
                    <span class="kr-compare-label">{metric.currentLabel || 'Latest'}</span>
                    <span class="kr-compare-bar" aria-hidden="true"><span class="kr-after" style={`width:${((current / max) * 100).toFixed(1)}%;`}></span></span>
                    <span class="kr-compare-value">{fmt(current)}</span>
                </div>
                {metric.definition && <p class="kr-tile-def">{metric.definition}</p>}
            </li>
        );
    }
    const percent = parsed && /^\s*%/.test(parsed.suffix) ? Math.max(0, Math.min(100, parsed.value)) : null;
    return (
        <li class="kr-tile">
            <p class="kr-tile-label">{metric.label}</p>
            <p class="kr-tile-big">{metric.metric}</p>
            {percent !== null && (
                <div class="kr-meter" aria-hidden="true"><div class="kr-meter-fill" style={`width:${percent}%;`}></div></div>
            )}
            {metric.definition && <p class="kr-tile-def">{metric.definition}</p>}
        </li>
    );
};

const Highlights: FC<{ objective: Objective }> = ({ objective }) => {
    const days = daysUntil(TITLE_II_DEADLINE.iso);
    return (
        <section class="kr-highlights" aria-labelledby="kr-highlights-h">
            <h2 id="kr-highlights-h">{objective.title}</h2>
            <ul class="kr-tiles">
                <li class="kr-tile kr-tile-deadline">
                    <p class="kr-tile-label">ADA Title II deadline</p>
                    <p class="kr-tile-big">{days > 0 ? `${fmt(days)} ${days === 1 ? 'day' : 'days'}` : 'In effect'}</p>
                    <p class="kr-tile-def">{days > 0 ? 'Until' : 'Since'} {TITLE_II_DEADLINE.label}, when WCAG 2.1 AA applies to UIC's websites and digital documents.</p>
                </li>
                {objective.metrics.map(metric => <HighlightTile metric={metric} />)}
            </ul>
        </section>
    );
};

const RankedList: FC<{ metrics: Metric[] }> = ({ metrics }) => {
    const rank = (metric: Metric) => parseDisplayValue(metric.metric)?.value ?? Number.MAX_SAFE_INTEGER;
    const sorted = [...metrics].sort((a, b) => rank(a) - rank(b));
    return (
        <ol class="kr-rank" role="list">
            {sorted.map((metric, i) => {
                const value = rank(metric);
                return (
                    <li class="kr-rank-item">
                        <span class="kr-rank-no">{value === Number.MAX_SAFE_INTEGER ? i + 1 : value}</span>
                        <div>
                            <p class="kr-rank-label">{metric.label}</p>
                            {metric.definition && <p class="kr-def">{metric.definition}</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
};

const ObjectiveCard: FC<{ objective: Objective }> = ({ objective }) => {
    const chart = objective.id === 'title-ii' ? <TrendChart /> : null;
    const metrics = isRanked(objective)
        ? [<RankedList metrics={objective.metrics} />]
        : objective.metrics.map(metric => <MetricRow metric={metric} />);
    const wide = isWide(objective);
    return (
        <article class={`kr-card${wide ? ' kr-card-wide' : ''}`}>
            <h3>{objective.title}{objective.upcoming ? ' (Upcoming)' : ''}</h3>
            <p class="kr-dates">{renderSubtitle(objective.subtitle)}</p>
            {wide ? (
                chart
                    ? <div class="kr-wide-body">{chart}<div class="kr-wide-metrics">{metrics}</div></div>
                    : <div class="kr-wide-metrics">{metrics}</div>
            ) : (
                <>{chart}{metrics}</>
            )}
        </article>
    );
};

/** The card's own metrics first, then metrics from other tabs flagged to also show here (labelled with their home card). */
const RelatedCard: FC<{ title: string; subtitle: string; own?: Metric[]; related: { metric: Metric; from: string }[] }> = ({ title, subtitle, own = [], related }) => (
    <article class="kr-card">
        <h3>{title}</h3>
        <p class="kr-dates">{subtitle}</p>
        {own.map(metric => <MetricRow metric={metric} />)}
        {related.map(({ metric, from }) => <MetricRow metric={metric} from={from} />)}
    </article>
);

type PanelTab = Exclude<TabId, 'highlights'>;

// `aliases` keeps links made under a tab's earlier name working
const PANELS: { id: PanelTab; hash: string; aliases?: string[]; description: string; relatedTitle: string }[] = [
    {
        id: 'title-ii', hash: 'title-ii', relatedTitle: 'Supporting Title II Work',
        description: `Progress toward WCAG 2.1 AA on UIC websites and digital documents ahead of the ${TITLE_II_DEADLINE.label} federal deadline.`,
    },
    {
        id: 'service', hash: 'engagement', relatedTitle: 'Related Engagement Work',
        description: "Training, consultation, and resources from UIC's Digital Accessibility Services team.",
    },
    {
        id: 'equalify', hash: 'solutions', aliases: ['tools', 'equalify'], relatedTitle: 'Related Solutions Work',
        description: "Equalify, the open-source accessibility platform built at UIC: website scanning, Iris PDF tagging, and who's using it.",
    },
];

// Progressive enhancement into the WAI-ARIA tabs pattern: roving tabindex,
// Left/Right/Home/End, and a #hash per tab so a link can open a specific tab.
const TABS_SCRIPT = `(function () {
    var root = document.querySelector('[data-kr-tabs]');
    if (!root) return;
    var list = root.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (tabs.length < 2) return;
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    panels.forEach(function (panel) { panel.setAttribute('role', 'tabpanel'); panel.setAttribute('tabindex', '0'); });
    list.hidden = false;
    root.classList.add('kr-tabs-ready');
    function select(index, focus, remember) {
        tabs.forEach(function (tab, i) {
            var on = i === index;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
            panels[i].classList.toggle('kr-inactive', !on);
        });
        if (focus) tabs[index].focus();
        if (remember && window.history && history.replaceState) history.replaceState(null, '', '#' + tabs[index].getAttribute('data-hash'));
    }
    function fromHash() {
        var hash = window.location.hash.slice(1);
        for (var i = 0; i < tabs.length; i++) {
            var aliases = (tabs[i].getAttribute('data-aliases') || '').split(' ');
            if (tabs[i].getAttribute('data-hash') === hash || aliases.indexOf(hash) >= 0) return i;
        }
        return -1;
    }
    var start = fromHash();
    select(start < 0 ? 0 : start, false, false);
    tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(i, false, true); });
        tab.addEventListener('keydown', function (event) {
            var next = null;
            if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            if (next === null) return;
            event.preventDefault();
            select(next, true, true);
        });
    });
    window.addEventListener('hashchange', function () { var i = fromHash(); if (i >= 0) select(i, false, false); });
})();`;

export const KeyResultsPage: FC<{ objectives: Objective[] }> = ({ objectives }) => {
    const user = getCurrentUser();
    const highlights = objectives.find(o => tabOf(o) === 'highlights');
    const sections = PANELS.map(panel => ({
        ...panel,
        label: TAB_LABELS[panel.id],
        // The tab's own cards, then cards from other tabs set to "also show" here
        cards: [
            ...objectives.filter(o => tabOf(o) === panel.id),
            ...objectives.filter(o => o.alsoOnTab === panel.id && tabOf(o) !== panel.id && tabOf(o) !== 'highlights'),
        ],
        // Metrics flagged "also show on this tab" from cards that live elsewhere
        related: objectives
            .filter(o => tabOf(o) !== panel.id && tabOf(o) !== 'highlights')
            .flatMap(o => o.metrics.filter(m => m.alsoOn === panel.id).map(metric => ({ metric, from: o.title }))),
    })).filter(section => section.cards.length > 0 || section.related.length > 0);

    return (
        <Layout title="Key Results" styles={styles} user={user}>
            <div class="kr-container">
                <h1>Key Results</h1>
                <p class="kr-intro">
                    The UIC Digital Accessibility team's tactical objectives and the numbers behind them.
                </p>

                {highlights && <Highlights objective={highlights} />}

                <div class="kr-tabset" data-kr-tabs>
                    <div class="kr-tabs" role="tablist" aria-label="Key Results sections" hidden>
                        {sections.map((section, i) => (
                            <button type="button" role="tab" id={`kr-tab-${section.hash}`} aria-controls={`kr-panel-${section.hash}`}
                                aria-selected={i === 0 ? 'true' : 'false'} tabindex={i === 0 ? 0 : -1} data-hash={section.hash} data-aliases={(section.aliases || []).join(' ')}>
                                {section.label}
                            </button>
                        ))}
                    </div>
                    {sections.map(section => (
                        <section class="kr-panel" id={`kr-panel-${section.hash}`} aria-labelledby={`kr-h-${section.hash}`}>
                            <h2 id={`kr-h-${section.hash}`}>{section.label}</h2>
                            <p class="kr-panel-desc">{section.description}</p>
                            <div class="kr-grid">
                                {section.cards.map(objective => objective.showsRelated
                                    ? ((objective.metrics.length > 0 || section.related.length > 0) && <RelatedCard title={objective.title} subtitle={renderSubtitle(objective.subtitle)} own={objective.metrics} related={section.related} />)
                                    : <ObjectiveCard objective={objective} />)}
                                {/* No placed "related" card on this tab: add one at the end so flagged metrics still show */}
                                {section.related.length > 0 && !section.cards.some(o => o.showsRelated) && (
                                    <RelatedCard title={section.relatedTitle} subtitle="Also shown in their own cards on other tabs" related={section.related} />
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                <p class="kr-footer-note">
                    Equalify metrics sync automatically. Team members can{' '}
                    <a href="/submit-stats">submit manual stats</a>.
                </p>
            </div>
            <script dangerouslySetInnerHTML={{ __html: TABS_SCRIPT }} />
        </Layout>
    );
};

export async function keyResultsHandler(c: Context) {
    const objectives = await getOrSeedObjectives();
    return c.html(<KeyResultsPage objectives={visibleObjectives(objectives)} />);
}
