import type { FC } from 'hono/jsx';
import { Layout } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

const styles = `
.about-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px 64px;
}
@media (max-width: 768px) {
    .about-container { padding: 32px 20px 48px; }
}
.about-container h1 {
    font-size: 36px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 20px;
}
.about-intro {
    font-size: 18px;
    line-height: 1.6;
    color: #1f2937;
    margin: 0 0 48px;
}

/* Section headings */
.section-heading {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
    scroll-margin-top: 100px;
}
.section-subheading {
    color: #4b5563;
    margin: 0 0 24px;
    font-size: 16px;
}

/* How-it-works cards */
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 48px;
}
@media (max-width: 768px) {
    .info-grid { grid-template-columns: 1fr; }
}
.info-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-left: 4px solid #C8102E;
    border-radius: 8px;
    padding: 20px;
}
.info-card h3 {
    margin: 0 0 6px;
    font-size: 16px;
    color: #1f2937;
}
.info-card p {
    margin: 0;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
}

/* Roadmap milestones */
.roadmap-item {
    display: flex;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid #e5e7eb;
}
.roadmap-item:last-child { border-bottom: none; }
.roadmap-status {
    flex-shrink: 0;
    width: 100px;
    text-align: center;
}
.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}
.status-in-progress { background: #dbeafe; color: #1e40af; }
.status-next { background: #fef3c7; color: #92400e; }
.status-planned { background: #f3f4f6; color: #4b5563; }
.roadmap-content { flex: 1; }
.roadmap-content h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #1f2937;
}
.roadmap-content p {
    margin: 0 0 8px;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
}
.roadmap-content ul {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.7;
}

/* Roles */
.roles-list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
}
.roles-list li {
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 15px;
    color: #4b5563;
}
.roles-list li:last-child { border-bottom: none; }
.roles-list strong { color: #1f2937; }
`;

export const AboutPage: FC = () => {
    const user = getCurrentUser();

    return (
        <Layout title="About" styles={styles} user={user}>
            <div class="about-container">
                <h1>About DASE Hub</h1>

                <p class="about-intro">
                    DASE Hub is the central dashboard for the UIC Digital Accessibility team's
                    projects. It channels incoming requests and feedback into a single, tracked
                    backlog so the dashboard is driven by an agreed roadmap rather than ad hoc
                    messages.
                </p>

                <h2 class="section-heading">How requests work</h2>
                <p class="section-subheading">
                    One intake path keeps requests from scattering across chats and messages.
                </p>

                <div class="info-grid">
                    <div class="info-card">
                        <h3>Single backlog</h3>
                        <p>
                            Feature, data, and fix requests are logged as tracked issues. Requests
                            raised in chat get converted into issues so nothing is lost.
                        </p>
                    </div>
                    <div class="info-card">
                        <h3>One source of truth</h3>
                        <p>
                            The backlog — not individual messages — is the record of what's
                            requested and where it stands.
                        </p>
                    </div>
                    <div class="info-card">
                        <h3>Regular check-ins</h3>
                        <p>
                            Weekly during active buildout, shifting to monthly at steady state.
                            New requests are reviewed and prioritized against the roadmap.
                        </p>
                    </div>
                    <div class="info-card">
                        <h3>Updates on releases</h3>
                        <p>
                            A short progress update goes out on each meaningful update or release.
                            Follow along on the <a href="/updates">Updates</a> page.
                        </p>
                    </div>
                </div>

                <h2 id="roadmap" class="section-heading">Roadmap</h2>
                <p class="section-subheading">
                    Reviewed at each check-in and may shift as priorities change.
                </p>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-in-progress">Now</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Phase 1 · Foundation</h3>
                        <ul>
                            <li>Lock the dashboard's scope and the core set of DASE projects and metrics it surfaces.</li>
                            <li>Triage the existing request backlog and convert outstanding messages into tracked issues.</li>
                            <li>Ship the core dashboard view.</li>
                        </ul>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-next">Next</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Phase 2 · Coverage</h3>
                        <ul>
                            <li>Add data views across the remaining DASE projects (e.g., Equalify, AI Leaders, Open Source Fund).</li>
                            <li>Add additional requested views and metrics.</li>
                        </ul>
                    </div>
                </div>

                <div class="roadmap-item">
                    <div class="roadmap-status">
                        <span class="status-badge status-planned">Later</span>
                    </div>
                    <div class="roadmap-content">
                        <h3>Phase 3 · Refinement</h3>
                        <ul>
                            <li>Enhancements based on team feedback: filtering, trends over time, and export/sharing.</li>
                            <li>Stretch items as they're confirmed.</li>
                        </ul>
                    </div>
                </div>

                <h2 class="section-heading" style="margin-top:48px;">Who runs it</h2>
                <p class="section-subheading">
                    DASE Hub is maintained by the UIC Digital Accessibility team.
                </p>
                <ul class="roles-list">
                    <li><strong>Responsible — Chris:</strong> builds and maintains the dashboard, triages requests, and maintains the roadmap.</li>
                    <li><strong>Accountable — Blake:</strong> sets direction and priorities, and approves the roadmap.</li>
                    <li><strong>Consulted — Jemma &amp; Stefin:</strong> advise on scope and priorities, and on how check-ins fit the team's meeting cadence.</li>
                    <li><strong>Informed — Helen &amp; Trey:</strong> kept up to date on progress and releases.</li>
                </ul>
            </div>
        </Layout>
    );
};
