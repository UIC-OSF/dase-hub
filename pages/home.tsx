import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { BaseLayout, Nav, Footer, site } from '#src/components/Layout';
import { getCurrentUser } from '#src/utils/auth';

const styles = `
body {
    min-height: 100vh;
    background: #ffffff;
}

/* Notification Banner */
.notification-banner {
    background: #C8102E;
    color: #ffffff;
    text-align: center;
    padding: 12px 24px;
    font-size: 15px;
}
.notification-banner a {
    color: #ffffff;
    text-decoration: underline;
    font-weight: 600;
}
.notification-banner a:hover {
    color: #e5e7eb;
}

/* Hero Section */
.hero {
    background: #001e62;
    padding: 80px 48px;
    text-align: center;
}
.hero-content {
    max-width: 800px;
    margin: 0 auto;
}
.hero-badge {
    display: inline-block;
    background: #C8102E;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.hero h1 {
    color: #ffffff;
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 20px 0;
    line-height: 1.2;
}
@media (max-width: 768px) {
    .hero h1 { font-size: 32px; }
    .hero { padding: 48px 24px; }
}
.hero p {
    color: #ffffff;
    font-size: 20px;
    line-height: 1.6;
    margin: 0 0 32px 0;
}
.hero-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
}
.hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
}
.hero-btn-primary {
    background: #C8102E;
    color: #ffffff;
}
.hero-btn-primary:hover {
    background: #9a0c23;
    text-decoration: none;
    transform: translateY(-2px);
}
.hero-btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.5);
}
.hero-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
    text-decoration: none;
    transform: translateY(-2px);
}

/* Product Cards */
.products-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 64px 48px;
}
@media (max-width: 768px) {
    .products-section { padding: 40px 20px; }
}
.products-section h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin: 0 0 8px;
}
.products-section .section-desc {
    text-align: center;
    color: #6b7280;
    margin: 0 0 40px;
    font-size: 16px;
    line-height: 1.6;
}
.products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
@media (max-width: 900px) {
    .products-grid { grid-template-columns: 1fr; }
}
.product-card {
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    text-decoration: none;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
}
a.product-card:hover {
    border-color: #C8102E;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    text-decoration: none;
}
.project-status {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 12px;
}
.status-live { background: #d1fae5; color: #065f46; }
.status-planned { background: #f3f4f6; color: #4b5563; }
.product-icon {
    width: 64px;
    height: 64px;
    background: #001e62;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}
.product-card h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
}
.product-card p {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 16px;
    line-height: 1.6;
}
.product-link {
    font-size: 14px;
    font-weight: 600;
    color: #C8102E;
    margin-top: auto;
}

/* Open Source Callout */
.open-source-callout {
    margin-top: 40px;
    background: #f8f9fa;
    border: 1px solid #d1d5db;
    border-left: 4px solid #001e62;
    border-radius: 8px;
    padding: 24px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}
@media (max-width: 600px) {
    .open-source-callout {
        flex-direction: column;
        gap: 12px;
    }
}
.open-source-callout h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
}
.open-source-callout p {
    font-size: 14px;
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
}
.open-source-callout a {
    color: #C8102E;
    font-weight: 600;
}
`;

export const HomePage: FC = () => {
    const user = getCurrentUser();

    return (
        <BaseLayout title="Central dashboard for UIC's Digital Accessibility team" styles={styles}>
            <Nav user={user} />
            <main>

            {/* Hero Section */}
            <section class="hero">
                <div class="hero-content">
                    <h1>DASE Hub</h1>
                    <p>
                        The central dashboard for UIC Digital Accessibility Services and
                        Engineering: one place to see our progress on ADA Title II, the rest of
                        our work, our projects, and who does what.
                    </p>
                    <div class="hero-buttons">
                        <a href="/key-results" class="hero-btn hero-btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <line x1="18" y1="20" x2="18" y2="10"/>
                                <line x1="12" y1="20" x2="12" y2="4"/>
                                <line x1="6" y1="20" x2="6" y2="14"/>
                            </svg>
                            View the ADA Title II Dashboard
                        </a>
                        <a href="/okra" class="hero-btn hero-btn-secondary">
                            View OKRA
                        </a>
                    </div>
                </div>
            </section>

            {/* Section cards */}
            <section class="products-section">
                <h2>What&rsquo;s in the Hub</h2>
                <p class="section-desc">
                    Numbers from Equalify update automatically several times a day. The team
                    updates the rest.
                </p>
                <div class="products-grid">
                    <a href="/key-results" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <h3>ADA Title II Dashboard</h3>
                        <p>
                            Where UIC stands on the ADA Title II requirement: pages scanned, issues fixed on rescanned sites, PDF pages converted, and course content accessibility over time.
                        </p>
                        <span class="product-link">View the dashboard &rarr;</span>
                    </a>
                    <a href="/okra" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                        </div>
                        <h3>OKRA</h3>
                        <p>
                            Our work beyond Title II, in three tabs: Engagement (training, consultation, outreach), Solutions (Equalify and PDF scanning), and AI Leaders.
                        </p>
                        <span class="product-link">View OKRA &rarr;</span>
                    </a>
                    <a href="/objective-7" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                        </div>
                        <h3>OKRA Objective 7</h3>
                        <p>
                            The campus digital accessibility objective and its five key results, with baselines, targets, owners, and progress.
                        </p>
                        <span class="product-link">View Objective 7 &rarr;</span>
                    </a>
                    <a href="/portfolio" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        </div>
                        <h3>Portfolio</h3>
                        <p>
                            The projects the team is running, with status, scope, and who is working on each one.
                        </p>
                        <span class="product-link">View the portfolio &rarr;</span>
                    </a>
                    <a href="/raci" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <h3>RACI</h3>
                        <p>
                            Who is responsible, accountable, consulted, and informed for each of the team&rsquo;s activities.
                        </p>
                        <span class="product-link">View the RACI chart &rarr;</span>
                    </a>
                    <a href="/testimonials" class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>
                        </div>
                        <h3>Testimonials</h3>
                        <p>
                            What partners across the university say about the team&rsquo;s training,
                            consultation, and resources.
                        </p>
                        <span class="product-link">Read the testimonials &rarr;</span>
                    </a>
                </div>

            </section>
            </main>
        </BaseLayout>
    );
};

export async function homeHandler(c: Context) {
    return c.html(<HomePage />);
}
