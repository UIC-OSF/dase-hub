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
                        The central dashboard for UIC's Digital Accessibility team — one place to
                        track projects, data, and progress across the work we do, driven by an
                        agreed roadmap.
                    </p>
                    <div class="hero-buttons">
                        <a href="/about#roadmap" class="hero-btn hero-btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                                <line x1="8" y1="2" x2="8" y2="18"/>
                                <line x1="16" y1="6" x2="16" y2="22"/>
                            </svg>
                            Roadmap
                        </a>
                        <a href="/signup" class="hero-btn hero-btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                            Sign Up for Updates
                        </a>
                    </div>
                </div>
            </section>

            {/* Project Cards */}
            <section class="products-section">
                <h2>Projects we track</h2>
                <p class="section-desc">
                    DASE Hub surfaces data and progress across the team's projects. Coverage is
                    rolling out in phases — see the <a href="/about#roadmap">roadmap</a>.
                </p>
                <div class="products-grid">
                    <a href={site.equalifyUrl} class="product-card" rel="noopener" target="_blank">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="3" y1="9" x2="21" y2="9"/>
                                <line x1="9" y1="21" x2="9" y2="9"/>
                            </svg>
                        </div>
                        <span class="project-status status-live">Live</span>
                        <h3>Equalify</h3>
                        <p>
                            Open-source platform for tracking and managing web accessibility issues
                            across sites. Visit the Equalify Hub for tools, docs, and updates.
                        </p>
                        <span class="product-link">Open Equalify Hub &rarr;</span>
                    </a>
                    <div class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                        </div>
                        <span class="project-status status-planned">On the roadmap</span>
                        <h3>AI Leaders</h3>
                        <p>
                            Data views for the AI Leaders project are planned as DASE Hub expands its
                            coverage across the team's work.
                        </p>
                        <span class="product-link">Coming soon</span>
                    </div>
                    <div class="product-card">
                        <div class="product-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                            </svg>
                        </div>
                        <span class="project-status status-planned">On the roadmap</span>
                        <h3>Open Source Fund</h3>
                        <p>
                            Coverage for the Open Source Fund is planned as part of the team's
                            broader project rollout.
                        </p>
                        <span class="product-link">Coming soon</span>
                    </div>
                </div>

                <div class="open-source-callout">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#001e62" stroke-width="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                    <div>
                        <h3>Built in the open</h3>
                        <p>
                            DASE Hub and the team's projects are maintained by the{' '}
                            University of Illinois Chicago (UIC) Digital Accessibility team.
                            Browse the repositories and follow along.{' '}
                            <a href={`https://github.com/${site.githubOrg}`} rel="noopener" target="_blank">View on GitHub &rarr;</a>
                        </p>
                    </div>
                </div>
            </section>
            </main>
        </BaseLayout>
    );
};

export async function homeHandler(c: Context) {
    return c.html(<HomePage />);
}
