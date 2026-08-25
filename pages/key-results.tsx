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
        {metric.source && (
            <span class="kr-source" title={metric.updatedAt ? `Synced ${timeAgo(metric.updatedAt)}` : undefined}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
                Synced from {metric.source === 'reflow' ? 'Reflow' : 'Equalify'}{metric.updatedAt ? ` · ${timeAgo(metric.updatedAt)}` : ''}
            </span>
        )}
    </div>
);

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
