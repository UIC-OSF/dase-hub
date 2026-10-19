import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { getOrSeedObjectives, visibleObjectives, renderSubtitle, Objective, Metric } from '#src/utils/keyResults';

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

const MetricRow: FC<{ metric: Metric }> = ({ metric }) => (
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
        {metric.definition && <p class="kr-def">{metric.definition}</p>}
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

export const KeyResultsPage: FC<{ objectives: Objective[] }> = ({ objectives }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Key Results" styles={styles} user={user}>
            <div class="kr-container">
                <h1>Key Results</h1>
                <p class="kr-intro">
                    The UIC Digital Accessibility team's tactical objectives and the numbers behind them.
                </p>

                <div class="kr-grid">
                    {objectives.map(objective => (
                        <article class="kr-card">
                            <h3>{objective.title}{objective.upcoming ? ' (Upcoming)' : ''}</h3>
                            <p class="kr-dates">{renderSubtitle(objective.subtitle)}</p>
                            {objective.id === 'title-ii' && <TrendChart />}
                            {objective.metrics.map(metric => <MetricRow metric={metric} />)}
                        </article>
                    ))}
                </div>

                <p class="kr-footer-note">
                    Equalify metrics sync automatically. Team members can{' '}
                    <a href="/submit-stats">submit manual stats</a>.
                </p>
            </div>
        </Layout>
    );
};

export async function keyResultsHandler(c: Context) {
    const objectives = await getOrSeedObjectives();
    return c.html(<KeyResultsPage objectives={visibleObjectives(objectives)} />);
}
