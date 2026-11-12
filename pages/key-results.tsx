import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { getIntegration, SeriesPoint, SOURCE_DEFINITIONS } from '#src/utils/keyResults';
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
.kr-trend > svg { display: block; width: 100%; height: auto; }
.kr-trend-axis { stroke: #d1d5db; stroke-width: 1; }
.kr-trend-grid { stroke: #e5e7eb; stroke-width: 1; stroke-dasharray: 3 3; }
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
/* Tactical objectives list */
.kr-objectives { margin: 0 0 36px; }
.kr-objectives > h2 { font-size: 24px; font-weight: 700; color: #001e62; margin: 0 0 12px; }
.kr-objectives ol { margin: 0; padding: 20px 24px 20px 48px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #C8102E; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); list-style: decimal; columns: 2; column-gap: 48px; font-size: 16px; color: #001e62; }
.kr-objectives li { margin: 0 0 10px; padding-left: 4px; break-inside: avoid; }
.kr-objectives a { color: #001e62; text-decoration: underline; text-underline-offset: 3px; }
.kr-objectives a:hover { color: #C8102E; }
.kr-objectives span { color: #4b5563; font-size: 14px; }
@media (max-width: 760px) { .kr-objectives ol { columns: 1; } }
.kr-objectives ol.kr-objectives-single { columns: 1; list-style: none; padding-left: 24px; font-size: 18px; font-weight: 600; }
.kr-objectives-single li { margin: 0; padding: 0; }
.kr-card:target, .kr-card:focus, .kr-card.kr-highlight { outline: 3px solid #C8102E; outline-offset: 3px; }
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
.kr-card { scroll-margin-top: 130px; }
.kr-wide-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.kr-trend-data summary { font-size: 13px; padding: 4px 0; width: fit-content; }
.kr-trend-data summary:focus-visible { outline: 3px solid #C8102E; outline-offset: 2px; }
.kr-trend-data caption { text-align: left; font-size: 12px; font-weight: 600; color: #1f2937; padding: 10px 0 4px; }
.kr-trend-data thead th { font-weight: 600; color: #1f2937; text-align: right; padding: 2px 0 2px 12px; }
.kr-trend-data thead th:first-child { text-align: left; padding-left: 0; }
.kr-trend-data td { padding-left: 12px; }
.kr-trend-data table { font-variant-numeric: tabular-nums; }
.kr-table-scroll { overflow-x: auto; }
.kr-detail-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px 20px; margin: 12px 0 4px; }
.kr-detail-metrics .kr-metric { margin: 0; }
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

// UIC course content accessibility scores from YuJa Panorama's monthly reports
// ("Cumulative Score" tab, Jan–Nov 2026, supplied by Digital Accessibility Services).
// Entered by hand: add a row when each month's report arrives.
const COURSE_SCORES = {
    label: 'UIC course content accessibility',
    note: 'Overall YuJa Panorama score for course files in Canvas, Mar–Nov 2026',
    columns: ['Overall', 'HTML', 'Word', 'PowerPoint', 'Excel', 'PDF'] as const,
    rows: [
        { month: 'Jan', scores: [73.65, 91.69, 70.06, 69.03, 70.29, 42.84] },
        { month: 'Feb', scores: [73.10, 91.48, 69.15, 69.81, 71.90, 41.07] },
        { month: 'Mar', scores: [71.30, 89.80, 69.15, 70.85, 71.99, 38.14] },
        { month: 'Apr', scores: [72.60, 90.10, 69.26, 71.02, 72.06, 40.85] },
        { month: 'May', scores: [73.24, 90.32, 69.19, 71.42, 72.11, 41.99] },
        { month: 'Jun', scores: [73.36, 90.30, 69.79, 71.41, 72.84, 43.17] },
        { month: 'Jul', scores: [73.55, 90.64, 69.56, 71.67, 72.99, 44.80] },
        { month: 'Aug', scores: [74.37, 91.37, 69.59, 71.91, 72.85, 44.99] },
        { month: 'Sep', scores: [73.99, 91.55, 69.68, 71.84, 72.32, 44.51] },
        { month: 'Oct', scores: [73.84, 91.71, 69.68, 71.79, 72.26, 44.19] },
        { month: 'Nov', scores: [73.81, 91.74, 69.69, 71.81, 72.18, 44.08] },
    ],
};

interface TrendPoint { month: string; value: number; year?: number }

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Monthly series points ('YYYY-MM') as chart points. */
const monthlyPoints = (series: SeriesPoint[]): TrendPoint[] =>
    series.map(point => ({ month: MONTH_NAMES[Number(point.at.slice(5, 7)) - 1], year: Number(point.at.slice(0, 4)), value: point.value }));

/** Line chart with a "See more details" disclosure underneath (children). `yMax` fixes the scale, e.g. 100 for percentages. */
const TrendChart: FC<{
    label: string; badge: string; note: string; points: TrendPoint[]; ariaLabel: string;
    yMax?: number; yMin?: number; format: (value: number) => string; compact: (value: number) => string; children?: any;
}> = ({ label, badge, note, points, ariaLabel, yMax, yMin, format, compact, children }) => {
    // A zoomed axis (yMin set) gets labelled gridlines and no area fill, so the cut-off baseline is obvious
    const zoomed = yMin !== undefined;
    const floor = yMin ?? 0;
    const W = 320, H = 120, left = zoomed ? 30 : 8, right = 60, top = 14, bottom = 22;
    const plotW = W - left - right, plotH = H - top - bottom;
    const max = yMax ?? Math.max(...points.map(p => p.value));
    const x = (i: number) => left + (i / (points.length - 1)) * plotW;
    const y = (v: number) => top + plotH - ((v - floor) / (max - floor)) * plotH;
    const gridValues = zoomed ? [floor, (floor + max) / 2, max] : [];
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const baseline = (top + plotH).toFixed(1);
    const area = `${line} L${x(points.length - 1).toFixed(1)},${baseline} L${left},${baseline} Z`;
    const lastIdx = points.length - 1;
    const last = points[lastIdx];
    return (
        <figure class="kr-trend">
            <figcaption>
                <span class="kr-trend-label">{label}</span>
                <span class="kr-trend-growth">{badge}</span>
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
                <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} class="kr-trend-axis" />
                {gridValues.map(v => (
                    <>
                        <line x1={left} y1={y(v)} x2={left + plotW} y2={y(v)} class="kr-trend-grid" />
                        <text x={left - 5} y={y(v) + 3} text-anchor="end" class="kr-trend-tick">{compact(v)}</text>
                    </>
                ))}
                {!zoomed && <path d={area} class="kr-trend-area" />}
                <path d={line} class="kr-trend-line" />
                {points.map((p, i) => i < lastIdx ? (
                    <circle cx={x(i)} cy={y(p.value)} r="3" class="kr-trend-pt">
                        <title>{p.month} {p.year ?? 2026}: {format(p.value)}</title>
                    </circle>
                ) : null)}
                <circle cx={x(lastIdx)} cy={y(last.value)} r="4" class="kr-trend-dot">
                    <title>{last.month} {last.year ?? 2026}: {format(last.value)}</title>
                </circle>
                <text x={x(lastIdx) + 8} y={y(last.value) + 4} class="kr-trend-value">{format(last.value)}</text>
                {points.map((p, i) => (!zoomed && i % 3 === 0 && i > 0 && i < lastIdx - 2) ? (
                    <text x={i === 0 ? x(i) + 2 : x(i) - 5} y={y(p.value) - 9} text-anchor={i === 0 ? 'start' : 'end'} class="kr-trend-mini">{compact(p.value)}</text>
                ) : null)}
                {points.map((p, i) => ((i % 3 === 0 && i < lastIdx - 1) || i === lastIdx) ? (
                    <text x={x(i)} y={H - 6} text-anchor={i === 0 ? 'start' : i === lastIdx ? 'end' : 'middle'} class="kr-trend-tick">{p.month}</text>
                ) : null)}
            </svg>
            <p class="kr-trend-note">{note}</p>
            {children && (
                <details class="kr-trend-data">
                    <summary>See more details</summary>
                    {children}
                </details>
            )}
        </figure>
    );
};

const ISSUES_GRAPH_START = '2026-03';
const pct = (v: number) => `${v.toFixed(1)}%`;
const thousands = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : fmt(v));

/** Reach graph (Equalify Scanning card): uic.edu web addresses tracked, cumulative. */
const WebAddressesChart: FC = () => {
    const web = TITLE_II_TREND.points;
    return (
        <TrendChart label={TITLE_II_TREND.label} badge={`${Math.round(web[web.length - 1].value / web[0].value)}× since ${web[0].month}`} note={TITLE_II_TREND.note} points={web}
            format={fmt} compact={thousands}
            ariaLabel={`${TITLE_II_TREND.label}, cumulative by month: ${fmt(web[0].value)} in ${web[0].month} 2026, rising to ${fmt(web[web.length - 1].value)} in ${web[web.length - 1].month} 2026.`}>
            <table>
                <caption>{TITLE_II_TREND.label}, by month</caption>
                <tbody>
                    {web.map(p => <tr><th scope="row">{p.month} 2026</th><td>{fmt(p.value)}</td></tr>)}
                </tbody>
            </table>
        </TrendChart>
    );
};

/**
 * The Title II card's two graphs: issues resolved on rescanned sites (details: the card's metrics)
 * and course content scores (details: by file type). The first comes from the Equalify sync's
 * monthly series; until a sync has produced it, the metrics show on their own.
 */
const TitleIICharts: FC<{ metrics: any; resolved?: SeriesPoint[] }> = ({ metrics, resolved }) => {
    // The graph starts in March 2026, when regular rescans began; earlier months had almost nothing to compare
    const issues = monthlyPoints((resolved || []).filter(point => point.at >= ISSUES_GRAPH_START));
    // Both graphs start in March 2026 so they cover the same months; the details table keeps January and February
    const course = COURSE_SCORES.rows.slice(2).map(r => ({ month: r.month, value: r.scores[0] }));
    const pdf = COURSE_SCORES.rows.map(r => r.scores[5]);
    const pdfPoints = COURSE_SCORES.rows.slice(2).map(r => ({ month: r.month, value: r.scores[5] }));
    const firstIssue = issues[0], lastIssue = issues[issues.length - 1];
    return (
        <>
            {issues.length >= 2 ? (
                <TrendChart label="Issues fixed on rescanned sites" badge={`${firstIssue.month} – ${lastIssue.month} ${lastIssue.year}`}
                    note="Cumulative: issues automated scans no longer find on sites rescanned with the same pages · Equalify" points={issues}
                    format={fmt} compact={thousands}
                    ariaLabel={`Issues fixed on rescanned sites, cumulative by month: ${fmt(firstIssue.value)} in ${firstIssue.month} ${firstIssue.year}, rising to ${fmt(lastIssue.value)} in ${lastIssue.month} ${lastIssue.year}.`}>
                    <p class="kr-def">{SOURCE_DEFINITIONS['equalify:issues_resolved']} The count is net, so it can dip in a month when new issues appear.</p>
                    <div class="kr-detail-metrics">{metrics}</div>
                    <table>
                        <caption>Issues fixed, cumulative by month</caption>
                        <tbody>
                            {issues.map(p => <tr><th scope="row">{p.month} {p.year}</th><td>{fmt(p.value)}</td></tr>)}
                        </tbody>
                    </table>
                </TrendChart>
            ) : <div class="kr-detail-metrics">{metrics}</div>}
            <TrendChart label={COURSE_SCORES.label} badge="Axis zoomed: 70% to 76%" note={`${COURSE_SCORES.note}. The axis is zoomed in to show month-to-month movement; the score has stayed within 3 points all year (January was 73.7%).`} points={course} yMin={70} yMax={76}
                format={pct} compact={v => `${Math.round(v)}%`}
                ariaLabel={`${COURSE_SCORES.label}, overall score by month: ${pct(course[0].value)} in ${course[0].month} 2026 and ${pct(course[course.length - 1].value)} in ${course[course.length - 1].month} 2026, staying between ${pct(Math.min(...course.map(p => p.value)))} and ${pct(Math.max(...course.map(p => p.value)))}.`}>
                <p class="kr-def">PDFs score lowest ({pct(pdf[pdf.length - 1])}, up from {pct(Math.min(...pdf))} in March); HTML content scores highest.</p>
                <div class="kr-table-scroll">
                    <table>
                        <caption>Score by file type and month, 2026</caption>
                        <thead>
                            <tr><th scope="col">Month</th>{COURSE_SCORES.columns.map(c => <th scope="col">{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {COURSE_SCORES.rows.map(r => <tr><th scope="row">{r.month}</th>{r.scores.map(v => <td>{pct(v)}</td>)}</tr>)}
                        </tbody>
                    </table>
                </div>
            </TrendChart>
            <TrendChart label="Course PDF accessibility" badge="Axis zoomed: 36% to 46%" points={pdfPoints} yMin={36} yMax={46}
                note={`YuJa Panorama score for PDFs in Canvas courses, Mar–Nov 2026. The axis is zoomed in to show movement (January was ${pct(pdf[0])}).`}
                format={pct} compact={v => `${Math.round(v)}%`}
                ariaLabel={`Course PDF accessibility score by month: ${pct(pdfPoints[0].value)} in ${pdfPoints[0].month} 2026, rising to ${pct(pdfPoints[pdfPoints.length - 1].value)} in ${pdfPoints[pdfPoints.length - 1].month} 2026.`}>
                <p class="kr-def">PDFs are the lowest-scoring file type in UIC courses and the most numerous documents: 391,429 PDF files in the October 2026 report.</p>
                <table>
                    <caption>PDF score by month, 2026</caption>
                    <tbody>
                        {COURSE_SCORES.rows.map(r => <tr><th scope="row">{r.month} 2026</th><td>{pct(r.scores[5])}</td></tr>)}
                    </tbody>
                </table>
            </TrendChart>
        </>
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

const Highlights: FC<{ objective?: Objective; deadline: boolean }> = ({ objective, deadline }) => {
    const days = daysUntil(TITLE_II_DEADLINE.iso);
    const metrics = objective?.metrics || [];
    if (!deadline && metrics.length === 0) return null;
    return (
        <section class="kr-highlights" aria-labelledby="kr-highlights-h">
            <h2 id="kr-highlights-h">{objective?.title || 'Highlights'}</h2>
            <ul class="kr-tiles">
                {deadline && <li class="kr-tile kr-tile-deadline">
                    <p class="kr-tile-label">ADA Title II deadline</p>
                    <p class="kr-tile-big">{days > 0 ? `${fmt(days)} ${days === 1 ? 'day' : 'days'}` : 'In effect'}</p>
                    <p class="kr-tile-def">{days > 0 ? 'Until' : 'Since'} {TITLE_II_DEADLINE.label}, when WCAG 2.1 AA applies to UIC's websites and digital documents.</p>
                </li>}
                {metrics.map(metric => <HighlightTile metric={metric} />)}
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

const ObjectiveCard: FC<{ objective: Objective; series?: Record<string, SeriesPoint[]> }> = ({ objective, series }) => {
    const metrics = isRanked(objective)
        ? [<RankedList metrics={objective.metrics} />]
        : objective.metrics.map(metric => <MetricRow metric={metric} />);
    const wide = isWide(objective);
    // The Title II card leads with its two graphs; its metrics sit under the first one, behind "See more details"
    const charts = objective.id === 'title-ii' ? <TitleIICharts metrics={metrics} resolved={series?.issues_resolved} /> : null;
    // Equalify Scanning leads with the reach graph
    const lead = objective.id === 'equalify-scanning' ? <WebAddressesChart /> : null;
    return (
        <article class={`kr-card${wide ? ' kr-card-wide' : ''}`} id={`card-${objective.id}`} data-objectives={objectivesOf(objective.id)} tabindex={-1}>
            <h3>{objective.title}{objective.upcoming ? ' (Upcoming)' : ''}</h3>
            <p class="kr-dates">{renderSubtitle(objective.subtitle)}</p>
            {charts
                ? (wide ? <div class="kr-wide-body">{charts}</div> : charts)
                : (wide ? <>{lead}<div class="kr-wide-metrics">{metrics}</div></> : <>{lead}{metrics}</>)}
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
    {
        id: 'ai-leaders', hash: 'ai-leaders', relatedTitle: 'Related AI Leaders Work',
        description: 'A free, open-source micro-credential in AI literacy and leadership, run by the UIC Open Source Fund.',
    },
];

// Progressive enhancement into the WAI-ARIA tabs pattern: roving tabindex,
// Left/Right/Home/End, and a #hash per tab so a link can open a specific tab.
const TABS_SCRIPT = `(function () {
    var root = document.querySelector('[data-kr-tabs]');
    if (!root) return;
    var list = root.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    panels.forEach(function (panel) { panel.setAttribute('role', 'tabpanel'); panel.setAttribute('tabindex', '0'); });
    if (tabs.length > 1) list.hidden = false;
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
        // A card's own link (#card-...): open the tab that holds it
        var cards = cardsFor(hash);
        if (cards.length) for (var j = 0; j < panels.length; j++) if (panels[j].contains(cards[0])) return j;
        return -1;
    }
    // "#card-<id>" names one card; "#objective-<slug>" names every card that belongs to that objective
    function cardsFor(hash) {
        if (hash.indexOf('card-') === 0) { var one = document.getElementById(hash); return one ? [one] : []; }
        if (hash.indexOf('objective-') !== 0) return [];
        var slug = hash.slice('objective-'.length);
        return Array.prototype.filter.call(root.querySelectorAll('[data-objectives]'), function (card) {
            return (card.getAttribute('data-objectives') || '').split(' ').indexOf(slug) >= 0;
        });
    }
    function goToCard() {
        var cards = cardsFor(window.location.hash.slice(1));
        Array.prototype.forEach.call(root.querySelectorAll('.kr-highlight'), function (card) { card.classList.remove('kr-highlight'); });
        if (!cards.length) return;
        cards.forEach(function (card) { card.classList.add('kr-highlight'); });
        cards[0].scrollIntoView({ block: 'start' });
        cards[0].focus({ preventScroll: true });
    }
    var start = fromHash();
    select(start < 0 ? 0 : start, false, false);
    goToCard();
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
    window.addEventListener('hashchange', function () { var i = fromHash(); if (i >= 0) select(i, false, false); goToCard(); });
})();`;

// The team's tactical objectives (from Jemma's original Key Results page, with the first two combined),
// each pointing at the card that holds its results. A card that is hidden or missing leaves the objective unlinked.
const TACTICAL_OBJECTIVES: { slug: string; title: string; cards: string[] }[] = [
    { slug: 'training', title: 'Promote Accessibility Awareness & Deliver Comprehensive Training', cards: ['accessibility-training-education'] },
    { slug: 'consultation', title: 'Provide Consultation Services', cards: ['consultation-evaluation'] },
    { slug: 'outreach', title: 'Expand Accessibility Outreach & Partnerships', cards: ['digital-resources-engagement'] },
    { slug: 'audit', title: 'Audit UIC Digital Assets', cards: ['equalify-scanning'] },
    { slug: 'compliance', title: 'Meet the ADA Title II requirement', cards: ['title-ii'] },
    { slug: 'equalify', title: 'Launch & Integrate Equalify Platform', cards: ['equalify-scanning', 'equalify-reflow', 'equalify-usage'] },
    { slug: 'ai', title: 'Champion AI Innovation & Open Source', cards: ['ai-leaders'] },
];

/** Objective slugs a card belongs to, for the "#objective-…" links that highlight every card of an objective. */
const objectivesOf = (cardId: string) => TACTICAL_OBJECTIVES.filter(o => o.cards.includes(cardId)).map(o => o.slug).join(' ');

/** Each page lists only its own objectives: Key Results has the one Title II objective, OKRA has the rest. */
const TacticalObjectives: FC<{ objectives: Objective[]; view: 'title-ii' | 'okra' }> = ({ objectives, view }) => {
    const items = TACTICAL_OBJECTIVES
        .map(item => ({ item, card: objectives.find(o => item.cards.includes(o.id)) }))
        .filter(({ item, card }) => (card ? (tabOf(card) === 'title-ii' ? 'title-ii' : 'okra') : (item.slug === 'compliance' ? 'title-ii' : 'okra')) === view);
    if (items.length === 0) return null;
    const single = items.length === 1;
    return (
        <section class="kr-objectives" aria-labelledby="kr-objectives-h">
            <h2 id="kr-objectives-h">{single ? 'Tactical Objective' : 'Tactical Objectives'}</h2>
            <ol class={single ? 'kr-objectives-single' : undefined}>
                {items.map(({ item, card }) => <li>{card ? <a href={`#objective-${item.slug}`}>{item.title}</a> : item.title}</li>)}
            </ol>
        </section>
    );
};

/**
 * Two pages share this layout:
 *   'title-ii' — Key Results: the ADA Title II work (one section, no tabs)
 *   'okra'     — OKRA: the team's work beyond Title II (Engagement and Solutions tabs, plus the Highlights tiles)
 */
type View = 'title-ii' | 'okra';
const VIEWS: Record<View, { title: string; intro: string; panels: PanelTab[] }> = {
    'title-ii': { title: 'ADA Title II Dashboard', intro: "UIC's progress toward ADA Title II digital accessibility compliance, and the numbers behind it.", panels: ['title-ii'] },
    'okra': { title: 'OKRA', intro: "The UIC Digital Accessibility team's objectives and key results beyond ADA Title II: engagement across campus and the solutions the team builds.", panels: ['service', 'equalify', 'ai-leaders'] },
};

export const KeyResultsPage: FC<{ objectives: Objective[]; series?: Record<string, SeriesPoint[]>; view?: View }> = ({ objectives, series, view = 'title-ii' }) => {
    const page = VIEWS[view];
    const user = getCurrentUser();
    const highlights = objectives.find(o => tabOf(o) === 'highlights');
    const sections = PANELS.filter(panel => page.panels.includes(panel.id)).map(panel => ({
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
        <Layout title={page.title} styles={styles} user={user}>
            <div class="kr-container">
                <h1>{page.title}</h1>
                <p class="kr-intro">{page.intro}</p>

                <TacticalObjectives objectives={objectives} view={view} />

                {view === 'okra'
                    ? <Highlights objective={highlights} deadline={false} />
                    : <Highlights deadline={true} />}

                <div class="kr-tabset" data-kr-tabs>
                    <div class="kr-tabs" role="tablist" aria-label="Dashboard sections" hidden>
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
                                    : <ObjectiveCard objective={objective} series={series} />)}
                                {/* No placed "related" card on this tab: add one at the end so flagged metrics still show */}
                                {section.related.length > 0 && !section.cards.some(o => o.showsRelated) && (
                                    <RelatedCard title={section.relatedTitle} subtitle="Also shown in their own cards on other tabs" related={section.related} />
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                <p class="kr-footer-note">
                    {view === 'okra'
                        ? <>ADA Title II work is on the <a href="/key-results">ADA Title II Dashboard</a>. </>
                        : <>Work beyond ADA Title II is on the <a href="/okra">OKRA</a> page; the campus objective is on <a href="/objective-7">OKRA Objective 7</a>. </>}
                    Equalify metrics sync automatically. Team members can{' '}
                    <a href="/submit-stats">submit manual stats</a>.
                </p>
            </div>
            <script dangerouslySetInnerHTML={{ __html: TABS_SCRIPT }} />
        </Layout>
    );
};

export async function keyResultsHandler(c: Context) {
    const [objectives, equalify] = await Promise.all([getOrSeedObjectives(), getIntegration('equalify')]);
    const view: View = c.req.path.replace(/\/$/, '') === '/okra' ? 'okra' : 'title-ii';
    return c.html(<KeyResultsPage objectives={visibleObjectives(objectives)} series={equalify?.series} view={view} />);
}
