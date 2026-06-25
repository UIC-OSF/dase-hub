import type { FC } from 'hono/jsx';
import type { Context } from 'hono';
import { Layout } from '#src/components/Layout';
import { getCurrentUser, getGitHubToken, fetchGitHub } from '#src/utils/auth';
import { renderMarkdown } from '#src/utils/markdown';
import config from '#src/utils/config';

const styles = `
/* Report cards */
.report-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.2s;
    text-decoration: none;
    display: block;
}
.report-card:hover {
    border-color: #C8102E;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.report-card h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #C8102E;
}
.report-card p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
}
.report-card .report-date {
    font-size: 12px;
    color: #4b5563;
    margin-top: 8px;
}

/* Single report view */
.report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
}
.report-header h1 {
    margin: 0;
    font-size: 28px;
    color: var(--color-text);
}
.back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-secondary);
    font-size: 14px;
    text-decoration: none;
    margin-bottom: 16px;
}
.back-link:hover {
    color: #C8102E;
}
.edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;
}
.edit-btn:hover {
    border-color: #C8102E;
    color: #C8102E;
}
.report-meta {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
}
.report-content {
    color: var(--color-text);
    line-height: 1.7;
}
.report-content h1 { font-size: 24px; margin: 24px 0 16px; color: var(--color-text); }
.report-content h2 { font-size: 20px; margin: 24px 0 12px; color: var(--color-text); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
.report-content h3 { font-size: 16px; margin: 20px 0 10px; color: var(--color-text); }
.report-content p { margin: 0 0 16px; }
.report-content ul { margin: 0 0 16px; padding-left: 24px; list-style: disc; }
.report-content ol { margin: 0 0 16px; padding-left: 24px; list-style: decimal; }
.report-content li { margin: 4px 0; }
.report-content code { background: var(--color-bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.report-content pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 0 0 16px; }
.report-content pre code { background: none; padding: 0; color: inherit; }
.report-content blockquote { border-left: 4px solid #C8102E; margin: 0 0 16px; padding: 12px 16px; background: var(--color-bg-secondary); color: var(--color-text-secondary); }
.report-content table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
.report-content th, .report-content td { border: 1px solid var(--color-border); padding: 8px 12px; text-align: left; }
.report-content th { background: var(--color-bg-secondary); font-weight: 600; }
.report-content a { color: #C8102E; }
.report-content img { max-width: 100%; border-radius: 6px; }
.report-content strong { color: var(--color-text); }
`;

interface ReportListItem {
    name: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    dateFormatted: string;
}

interface ReportFile {
    name: string;
    title: string;
    author: string;
    date: string;
    dateFormatted: string;
    content: string;
    html_url: string;
}

interface Frontmatter {
    title: string;
    date: string;
    dateFormatted: string;
    description: string;
    author: string;
}

// Parse YAML frontmatter from markdown content
function parseFrontmatter(content: string, fallbackTitle: string): { frontmatter: Frontmatter; body: string } {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    let frontmatter: Frontmatter = {
        title: fallbackTitle,
        date: '',
        dateFormatted: '',
        description: '',
        author: ''
    };
    let body = content;

    if (frontmatterMatch) {
        const yaml = frontmatterMatch[1];
        body = frontmatterMatch[2];

        // Parse title
        const titleMatch = yaml.match(/^title:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (titleMatch) {
            frontmatter.title = titleMatch[1].trim();
        }

        // Parse date (supports YYYY-MM-DD format)
        const dateMatch = yaml.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m);
        if (dateMatch) {
            frontmatter.date = dateMatch[1];
            const dateObj = new Date(dateMatch[1] + 'T00:00:00');
            frontmatter.dateFormatted = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Parse description
        const descMatch = yaml.match(/^description:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (descMatch) {
            frontmatter.description = descMatch[1].trim();
        }

        // Parse author
        const authorMatch = yaml.match(/^author:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (authorMatch) {
            frontmatter.author = authorMatch[1].trim();
        }
    } else {
        // No frontmatter - check for first H1 heading as title
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
            frontmatter.title = h1Match[1].trim();
        }
    }

    return { frontmatter, body };
}

// Convert filename to fallback title
function filenameToTitle(filename: string): string {
    return filename
        .replace('.md', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// List view - shows reports + updates
export const ReportsListPage: FC<{ reports: ReportListItem[]; updates: ReportListItem[] }> = ({ reports, updates }) => {
    const user = getCurrentUser();

    return (
        <Layout title="Updates" styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <h1 style="font-size:32px;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">Updates</h1>
                <p style="color:var(--color-text-secondary);margin:0 0 32px 0;font-size:16px;">
                    Monthly development reports, project news, and release notes for DASE Hub.
                </p>

                <h2 style="font-size:20px;font-weight:600;color:var(--color-text);margin:0 0 16px 0;">Monthly Reports</h2>

                {reports.length > 0 ? (
                    reports.map(report => (
                        <a href={`/reports/${report.slug}`} class="report-card">
                            <h3>{report.title}</h3>
                            {report.description && (
                                <p>{report.description}</p>
                            )}
                            {report.dateFormatted && (
                                <div class="report-date">{report.dateFormatted}</div>
                            )}
                        </a>
                    ))
                ) : (
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                        <p style="margin:0;color:#713f12;">No reports available yet. Check back soon!</p>
                    </div>
                )}

                {updates.length > 0 && (
                    <>
                        <h2 style="font-size:20px;font-weight:600;color:var(--color-text);margin:40px 0 16px 0;">News</h2>
                        {updates.map(update => (
                            <a href={`/updates/${update.slug}`} class="report-card">
                                <h3>{update.title}</h3>
                                {update.description && (
                                    <p>{update.description}</p>
                                )}
                                {update.dateFormatted && (
                                    <div class="report-date">{update.dateFormatted}</div>
                                )}
                            </a>
                        ))}
                    </>
                )}
            </div>
        </Layout>
    );
};

// Single report view - shows one report's content
export const ReportsDocPage: FC<{ report: ReportFile }> = ({ report }) => {
    const user = getCurrentUser();
    const displayTitle = report.title;

    return (
        <Layout title={`${displayTitle} - Updates`} styles={styles} user={user}>
            <div style="max-width:900px;margin:0 auto;padding:32px 48px 64px;">
                <a href="/updates" class="back-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Updates
                </a>

                <div class="report-header">
                    <h1>{displayTitle}</h1>
                    <a href={report.html_url} class="edit-btn" rel="noopener" target="_blank">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit on GitHub
                    </a>
                </div>

                {(report.dateFormatted || report.author) && (
                    <div class="report-meta">
                        {report.dateFormatted && <>Published {report.dateFormatted}</>}
                        {report.dateFormatted && report.author && <> · </>}
                        {report.author && <>By {report.author}</>}
                    </div>
                )}

                <div class="report-content" dangerouslySetInnerHTML={{ __html: report.content }} />
            </div>
        </Layout>
    );
};

// Fetch a folder of markdown docs from the configured docs repo
async function fetchDocFolder(folder: string, token: string): Promise<ReportListItem[]> {
    try {
        const contents = await fetchGitHub(
            `https://api.github.com/repos/${config.docsRepo}/contents/${folder}`,
            token
        );

        if (!Array.isArray(contents)) return [];

        const mdFiles = contents.filter((f: any) => f.name.endsWith('.md'));

        const items = await Promise.all(mdFiles.map(async (file: any) => {
            try {
                const fileData = await fetchGitHub(
                    `https://api.github.com/repos/${config.docsRepo}/contents/${folder}/${file.name}`,
                    token
                );

                if (fileData && fileData.content) {
                    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                    const fallbackTitle = filenameToTitle(file.name);
                    const { frontmatter } = parseFrontmatter(content, fallbackTitle);

                    return {
                        name: file.name,
                        slug: file.name.replace('.md', ''),
                        title: frontmatter.title,
                        description: frontmatter.description,
                        author: frontmatter.author,
                        date: frontmatter.date,
                        dateFormatted: frontmatter.dateFormatted
                    };
                }
            } catch (error) {
                console.error(`Error fetching ${file.name}:`, error);
            }

            const fallbackTitle = filenameToTitle(file.name);
            return {
                name: file.name,
                slug: file.name.replace('.md', ''),
                title: fallbackTitle,
                description: '',
                author: '',
                date: '',
                dateFormatted: ''
            };
        }));

        items.sort((a, b) => {
            if (!a.date && !b.date) return a.title.localeCompare(b.title);
            if (!a.date) return 1;
            if (!b.date) return -1;
            return b.date.localeCompare(a.date);
        });

        return items;
    } catch (error) {
        console.error(`Error fetching ${folder}:`, error);
        return [];
    }
}

// Handler for list view
export async function reportsHandler(c: Context) {
    const token = getGitHubToken();

    const [reports, updates] = await Promise.all([
        fetchDocFolder('reports', token),
        fetchDocFolder('updates', token),
    ]);

    return c.html(<ReportsListPage reports={reports} updates={updates} />);
}

// Handler for single report view
export async function reportsDocHandler(c: Context) {
    const slug = c.req.param('slug');
    const token = getGitHubToken();
    const filename = `${slug}.md`;

    try {
        const fileData = await fetchGitHub(
            `https://api.github.com/repos/${config.docsRepo}/contents/reports/${filename}`,
            token
        );

        if (fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const fallbackTitle = filenameToTitle(filename);
            const { frontmatter, body } = parseFrontmatter(content, fallbackTitle);

            const report: ReportFile = {
                name: filename,
                title: frontmatter.title,
                author: frontmatter.author,
                date: frontmatter.date,
                dateFormatted: frontmatter.dateFormatted,
                content: renderMarkdown(body),
                html_url: fileData.html_url
            };

            return c.html(<ReportsDocPage report={report} />);
        }
    } catch (error) {
        console.error('Error fetching report:', error);
    }

    // Report not found - redirect to list
    return c.redirect('/reports');
}
