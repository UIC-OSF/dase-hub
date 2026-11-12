import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';
import { PROJECTS, RACI_MEMBERS, RACI_ACTIVITIES, OKRA_OBJECTIVE, TESTIMONIALS } from '#src/utils/teamData';

// Project Portfolio and RACI pages, migrated from Jemma's prototype site.
// Content lives in utils/teamData.ts.

const LAST_UPDATED = 'January 16, 2026';

const styles = `
.tm-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px 64px; }
.tm-container > h1 { font-size: 32px; font-weight: 700; color: #001e62; margin: 0 0 4px; }
.tm-intro { color: #4b5563; margin: 0 0 32px; font-size: 15px; }
.tm-container h2 { font-size: 24px; font-weight: 700; color: #001e62; margin: 0 0 16px; }
.tm-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
@media (max-width: 1000px) { .tm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px)  { .tm-grid { grid-template-columns: minmax(0, 1fr); } }
.tm-card { background: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid #C8102E; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.tm-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin: 0 0 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
.tm-card h3 { font-size: 17px; font-weight: 700; color: #001e62; margin: 0; }
.tm-status { flex-shrink: 0; font-size: 12px; font-weight: 700; color: #1f2937; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 3px 9px; white-space: nowrap; }
.tm-card p { font-size: 14px; color: #1f2937; line-height: 1.55; margin: 0 0 12px; }
.tm-card ul { margin: 0 0 16px; padding-left: 20px; list-style: disc; font-size: 14px; color: #1f2937; line-height: 1.6; }
.tm-card h4 { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #4b5563; margin: 0 0 4px; }
.tm-team { font-size: 14px; color: #1f2937; margin: 0; }
.tm-updated { margin-top: 32px; font-size: 13px; color: #4b5563; text-align: center; }

/* RACI */
.tm-legend { list-style: none; display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 0 0 36px; padding: 16px 20px; background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #1f2937; }
.tm-legend li { display: flex; align-items: center; gap: 8px; }
.tm-legend em { color: #4b5563; }
.tm-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 13px; font-weight: 700; color: #ffffff; flex-shrink: 0; }
.tm-r { background: #C8102E; }
.tm-a { background: #001e62; }
.tm-c { background: #2e7d32; }
.tm-i { background: #4b5563; }
.tm-raci-group { margin: 0 0 14px; }
.tm-raci-group:last-child { margin-bottom: 0; }
.tm-raci-group h4 { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-size: 14px; color: #1f2937; margin: 0 0 6px; }
.tm-raci-group ul { margin: 0; }

/* OKRA board */
.tm-objective { background: #001e62; color: #ffffff; border-radius: 10px; padding: 24px 28px; margin: 0 0 32px; }
.tm-objective h2 { color: #ffffff; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 8px; }
.tm-objective p { font-size: 19px; line-height: 1.5; margin: 0; max-width: 60em; }
.tm-kr-list { display: flex; flex-direction: column; gap: 16px; }
.tm-kr { background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #C8102E; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 12px 32px; align-items: start; }
@media (max-width: 760px) { .tm-kr { grid-template-columns: minmax(0, 1fr); } }
.tm-kr h3 { font-size: 17px; font-weight: 700; color: #001e62; margin: 0 0 6px; }
.tm-kr-metric { font-size: 14px; color: #1f2937; line-height: 1.55; margin: 0 0 12px; }
.tm-kr dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 14px; margin: 0; font-size: 14px; }
.tm-kr dt { font-weight: 600; color: #4b5563; }
.tm-kr dd { margin: 0; color: #1f2937; }
.tm-kr-pct { font-size: 34px; font-weight: 800; color: #001e62; line-height: 1.1; margin: 0; font-variant-numeric: tabular-nums; }
.tm-kr-pct-label { font-size: 13px; color: #4b5563; margin: 2px 0 8px; }
.tm-meter { height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
.tm-meter span { display: block; height: 100%; background: #2e7d32; border-radius: 5px; }
.tm-links { margin-top: 32px; font-size: 15px; color: #1f2937; }
.tm-links a { color: #C8102E; font-weight: 600; }

/* Testimonials */
.tm-quotes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin: 0 0 36px; padding: 0; list-style: none; }
@media (max-width: 760px) { .tm-quotes { grid-template-columns: minmax(0, 1fr); } }
.tm-quote { margin: 0; height: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #C8102E; border-radius: 10px; padding: 24px 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.tm-quote blockquote { margin: 0; font-size: 16px; line-height: 1.65; color: #1f2937; }
.tm-quote blockquote::before { content: "\\201C"; display: block; font-size: 44px; line-height: 0.8; font-weight: 700; color: #C8102E; margin-bottom: 4px; }
.tm-quote figcaption { margin-top: 12px; font-size: 14px; font-weight: 600; color: #4b5563; }
`;

export const PortfolioPage: FC = () => (
    <Layout title="Project Portfolio" styles={styles} user={getCurrentUser()}>
        <div class="tm-container">
            <h1>Project Portfolio</h1>
            <p class="tm-intro">The UIC Digital Accessibility team's projects, what each one covers, and who works on it.</p>
            <h2>All Projects</h2>
            <div class="tm-grid">
                {PROJECTS.map(project => (
                    <article class="tm-card">
                        <div class="tm-card-head">
                            <h3>{project.title}</h3>
                            <span class="tm-status">{project.status}</span>
                        </div>
                        <p>{project.description}</p>
                        <ul>{project.items.map(item => <li>{item}</li>)}</ul>
                        <h4>Key Team Members</h4>
                        <p class="tm-team">{project.team.join(', ')}</p>
                    </article>
                ))}
            </div>
            <p class="tm-updated">Last updated: {LAST_UPDATED}</p>
        </div>
    </Layout>
);

const RACI_ROLES = [
    { code: 'R', label: 'Responsible', note: 'The Doer' },
    { code: 'A', label: 'Accountable', note: 'The Buck Stops Here' },
    { code: 'C', label: 'Consulted', note: 'Penny for Thoughts' },
    { code: 'I', label: 'Informed', note: 'Just FYI' },
];
// Member cards list Accountable first, as on the original page
const CARD_ORDER = ['A', 'R', 'C', 'I'];

export const RaciPage: FC = () => (
    <Layout title="RACI Matrix" styles={styles} user={getCurrentUser()}>
        <div class="tm-container">
            <h1>RACI Matrix</h1>
            <p class="tm-intro">Who is responsible, accountable, consulted and informed for each of the UIC Digital Accessibility team's activities.</p>
            <h2>RACI Definitions</h2>
            <ul class="tm-legend">
                {RACI_ROLES.map(role => (
                    <li><span class={`tm-badge tm-${role.code.toLowerCase()}`} aria-hidden="true">{role.code}</span> <strong>{role.label}</strong> <em>({role.note})</em></li>
                ))}
            </ul>
            <h2>Team Member Responsibilities</h2>
            <div class="tm-grid">
                {RACI_MEMBERS.map(member => (
                    <article class="tm-card">
                        <div class="tm-card-head"><h3>{member.name}</h3></div>
                        {CARD_ORDER.map(code => {
                            const role = RACI_ROLES.find(r => r.code === code)!;
                            const activities = RACI_ACTIVITIES
                                .filter(task => (task.raci[member.id] || '').includes(code))
                                .map(task => task.activity)
                                .sort((a, b) => a.localeCompare(b));
                            return activities.length > 0 ? (
                                <div class="tm-raci-group">
                                    <h4><span class={`tm-badge tm-${code.toLowerCase()}`} aria-hidden="true">{code}</span> {role.label}</h4>
                                    <ul>{activities.map(activity => <li>{activity}</li>)}</ul>
                                </div>
                            ) : null;
                        })}
                    </article>
                ))}
            </div>
            <p class="tm-updated">Last updated: {LAST_UPDATED}</p>
        </div>
    </Layout>
);

export const OkraPage: FC = () => (
    <Layout title="OKRA Objective 7" styles={styles} user={getCurrentUser()}>
        <div class="tm-container">
            <h1>OKRA Objective {OKRA_OBJECTIVE.number}</h1>
            <p class="tm-intro">The campus ADA Title II objective and its key results, as reported in the OKRA submission. Live numbers are on the ADA Title II Dashboard.</p>
            <section class="tm-objective" aria-labelledby="tm-objective-h">
                <h2 id="tm-objective-h">Objective {OKRA_OBJECTIVE.number}</h2>
                <p>{OKRA_OBJECTIVE.statement}</p>
            </section>
            <h2>Key Results</h2>
            <div class="tm-kr-list">
                {OKRA_OBJECTIVE.keyResults.map((kr, i) => (
                    <article class="tm-kr">
                        <div>
                            <h3>Key Result {i + 1}: {kr.title}</h3>
                            <p class="tm-kr-metric">{kr.metric}</p>
                            <dl>
                                <dt>Baseline</dt><dd>{kr.baseline}</dd>
                                <dt>Target</dt><dd>{kr.target}</dd>
                                <dt>Planning cycle</dt><dd>{kr.cycle}</dd>
                                <dt>Owner</dt><dd>{kr.owner}</dd>
                            </dl>
                        </div>
                        <div>
                            <p class="tm-kr-pct">{kr.percent}%</p>
                            <p class="tm-kr-pct-label">complete, as reported</p>
                            <div class="tm-meter" role="progressbar" aria-valuenow={kr.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Key Result ${i + 1}: ${kr.percent}% complete`}>
                                <span style={`width:${kr.percent}%;`}></span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            <p class="tm-links">
                Related: <a href="/key-results">ADA Title II Dashboard</a> · <a href="/okra">OKRA</a> · <a href="/portfolio">Project Portfolio</a> · <a href="/raci">RACI Matrix</a>
            </p>
        </div>
    </Layout>
);

const QuoteList: FC<{ items: typeof TESTIMONIALS }> = ({ items }) => (
    <ul class="tm-quotes">
        {items.map(t => (
            <li>
                <figure class="tm-quote">
                    <blockquote>{t.quote}</blockquote>
                    {t.source && <figcaption>{t.source}</figcaption>}
                </figure>
            </li>
        ))}
    </ul>
);

export const TestimonialsPage: FC = () => {
    const categories = [...new Set(TESTIMONIALS.map(t => t.category).filter(Boolean))] as string[];
    const uncategorized = TESTIMONIALS.filter(t => !t.category);
    return (
        <Layout title="Testimonials" styles={styles} user={getCurrentUser()}>
            <div class="tm-container">
                <h1>Testimonials</h1>
                <p class="tm-intro">
                    What partners across the university say about working with the Digital Accessibility team.
                </p>
                {categories.map(cat => (
                    <section>
                        <h2>{cat}</h2>
                        <QuoteList items={TESTIMONIALS.filter(t => t.category === cat)} />
                    </section>
                ))}
                {uncategorized.length > 0 && <QuoteList items={uncategorized} />}
            </div>
        </Layout>
    );
};
